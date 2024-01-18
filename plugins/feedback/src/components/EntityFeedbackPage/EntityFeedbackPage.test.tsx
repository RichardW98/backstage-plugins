import React from 'react';

import { ConfigReader } from '@backstage/config';
import {
  BackstageUserIdentity,
  configApiRef,
  IdentityApi,
  identityApiRef,
} from '@backstage/core-plugin-api';
import {
  EntityProvider,
  entityRouteRef,
} from '@backstage/plugin-catalog-react';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';

import { FeedbackAPI, feedbackApiRef } from '../../api';
import { mockEntity, mockFeedback } from '../../mocks';
import { EntityFeedbackPage } from './EntityFeedbackPage';

describe('Entity Feedback Page', () => {
  const feedbackApi: Partial<FeedbackAPI> = {
    getAllFeedbacks: jest.fn().mockImplementation(() => {
      return Promise.resolve({
        data: [mockFeedback],
        count: 1,
        currentPage: 1,
        pageSize: 5,
      });
    }),
  };

  const mockIdentityApi: Partial<IdentityApi> = {
    getBackstageIdentity: jest
      .fn()
      .mockImplementation((): BackstageUserIdentity => {
        return {
          userEntityRef: 'user:default/guest',
          type: 'user',
          ownershipEntityRefs: [],
        };
      }),
  };

  const mockConfigApi = new ConfigReader({
    feedback: { integrations: { jira: [{ host: 'https://jira-server-url' }] } },
  });

  const render = async () =>
    await renderInTestApp(
      <TestApiProvider
        apis={[
          [feedbackApiRef, feedbackApi],
          [identityApiRef, mockIdentityApi],
          [configApiRef, mockConfigApi],
        ]}
      >
        <EntityProvider entity={mockEntity}>
          <EntityFeedbackPage />
        </EntityProvider>
      </TestApiProvider>,
      {
        mountedRoutes: {
          '/catalog/:namespace/:kind/:name/': entityRouteRef,
        },
      },
    );

  it('Should render', async () => {
    const rendered = await render();
    expect(rendered).toBeDefined();
  });

  it('Should have buttons', async () => {
    const rendered = await render();
    expect(
      rendered.getByRole('button', { name: 'Create' }),
    ).toBeInTheDocument();
    expect(
      rendered.getByRole('button', { name: 'Refresh' }),
    ).toBeInTheDocument();
    expect(
      rendered.getByRole('link', { name: 'Go to Jira Project' }),
    ).toBeInTheDocument();
  });
});
