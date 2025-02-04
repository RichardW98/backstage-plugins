import React from 'react';

import { InfoCard, Progress } from '@backstage/core-components';

import {
  Box,
  makeStyles,
  Paper,
  Table,
  TableBody,
  TableCell,
  TablePagination,
  TableRow,
  Toolbar,
  Typography,
} from '@material-ui/core';

import {
  computedStatus,
  PipelineRunKind,
  pipelineRunStatus,
} from '@janus-idp/shared-react';

import { TektonResourcesContext } from '../../hooks/TektonResourcesContext';
import { ClusterErrors, Order } from '../../types/types';
import { getComparator } from '../../utils/tekton-utils';
import { ClusterSelector, ErrorPanel } from '../common';
import { StatusSelector } from '../common/StatusSelector';
import { TableExpandCollapse } from '../common/TableExpandCollapse';
import { PipelineRunColumnHeader } from './PipelineRunColumnHeader';
import { PipelineRunListSearchBar } from './PipelineRunListSearchBar';
import { PipelineRunTableBody } from './PipelineRunTableBody';
import { EnhancedTableHead } from './PipelineTableHeader';

type WrapperInfoCardProps = {
  allErrors?: ClusterErrors;
  showClusterSelector?: boolean;
  titleClassName?: string;
};

const useStyles = makeStyles(theme => ({
  root: {
    alignItems: 'start',
    padding: theme.spacing(3, 0, 2.5, 2.5),
  },
  empty: {
    padding: theme.spacing(2),
    display: 'flex',
    justifyContent: 'center',
  },
  title: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
  },
  footer: {
    '&:nth-of-type(odd)': {
      backgroundColor: `${theme.palette.background.paper}`,
    },
  },
}));

const WrapperInfoCard = ({
  children,
  allErrors,
  showClusterSelector = true,
  titleClassName,
}: React.PropsWithChildren<WrapperInfoCardProps>) => (
  <>
    {allErrors && allErrors.length > 0 && <ErrorPanel allErrors={allErrors} />}
    <InfoCard
      {...(showClusterSelector && {
        title: (
          <div className={titleClassName}>
            <ClusterSelector />
            <StatusSelector />
            <TableExpandCollapse />
          </div>
        ),
      })}
    >
      {children}
    </InfoCard>
  </>
);

const PipelineRunList = () => {
  const {
    loaded,
    responseError,
    watchResourcesData,
    selectedClusterErrors,
    clusters,
    selectedStatus,
  } = React.useContext(TektonResourcesContext);
  const [order, setOrder] = React.useState<Order>('desc');
  const [orderBy, setOrderBy] = React.useState<string>('status.startTime');
  const [orderById, setOrderById] = React.useState<string>('startTime'); // 2 columns have the same field
  const [page, setPage] = React.useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = React.useState<number>(5);
  const [filteredPipelineRuns, setFilteredPipelineRuns] = React.useState<
    PipelineRunKind[] | undefined
  >();

  const totalPlrs = watchResourcesData?.pipelineruns?.data?.map(d => ({
    ...d,
    id: d.metadata.uid,
  }));

  const pipelineRunsData = React.useMemo(
    () =>
      selectedStatus === computedStatus.All
        ? totalPlrs
        : // eslint-disable-next-line consistent-return
          totalPlrs?.filter(plr => {
            if (pipelineRunStatus(plr) === selectedStatus) {
              return plr;
            }
          }),
    [selectedStatus, totalPlrs],
  );

  const pipelineRuns = filteredPipelineRuns || pipelineRunsData;

  const handleRequestSort = (
    _event: React.MouseEvent<unknown>,
    property: string,
    id: string,
  ) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
    setOrderById(id);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0
      ? Math.max(0, (1 + page) * rowsPerPage - (pipelineRuns?.length ?? 0))
      : 0;

  const visibleRows = React.useMemo(
    () =>
      pipelineRuns
        ?.sort(getComparator(order, orderBy, orderById))
        .slice(
          page * rowsPerPage,
          page * rowsPerPage + rowsPerPage,
        ) as PipelineRunKind[],
    [pipelineRuns, order, orderBy, orderById, page, rowsPerPage],
  );
  const classes = useStyles();

  const allErrors: ClusterErrors = [
    ...(responseError ? [{ message: responseError }] : []),
    ...(selectedClusterErrors ?? []),
  ];

  if (!loaded && !responseError)
    return (
      <div data-testid="tekton-progress">
        <Progress />
      </div>
    );

  return (
    <WrapperInfoCard
      allErrors={allErrors}
      showClusterSelector={clusters.length > 0}
      titleClassName={classes.title}
    >
      <Box>
        <Paper>
          <Toolbar>
            <Typography variant="h5" component="h2">
              Pipeline Runs
            </Typography>
            <PipelineRunListSearchBar
              pipelineRuns={pipelineRunsData}
              onSearch={setFilteredPipelineRuns}
            />
          </Toolbar>
          <Table
            aria-labelledby="Pipeline Runs"
            size="small"
            style={{ width: '100%' }}
          >
            <EnhancedTableHead
              order={order}
              orderBy={orderBy}
              orderById={orderById}
              onRequestSort={handleRequestSort}
            />
            {visibleRows?.length > 0 ? (
              <TableBody>
                <PipelineRunTableBody rows={visibleRows} />
                {emptyRows > 0 && (
                  <TableRow
                    style={{
                      height: 33 * emptyRows,
                    }}
                  >
                    <TableCell colSpan={PipelineRunColumnHeader.length} />
                  </TableRow>
                )}
                <TableRow className={classes.footer}>
                  <TablePagination
                    rowsPerPageOptions={[
                      { value: 5, label: '5 rows' },
                      { value: 10, label: '10 rows' },
                      { value: 25, label: '25 rows' },
                    ]}
                    count={pipelineRuns?.length ?? 0}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage={null}
                  />
                </TableRow>
              </TableBody>
            ) : (
              <tbody>
                <tr>
                  <td colSpan={PipelineRunColumnHeader.length}>
                    <div
                      data-testid="no-pipeline-runs"
                      className={classes.empty}
                    >
                      No Pipeline Runs found
                    </div>
                  </td>
                </tr>
              </tbody>
            )}
          </Table>
        </Paper>
      </Box>
    </WrapperInfoCard>
  );
};

export default React.memo(PipelineRunList);
