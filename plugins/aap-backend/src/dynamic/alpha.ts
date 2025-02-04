import { loggerToWinstonLogger } from '@backstage/backend-common';
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { BackendDynamicPluginInstaller } from '@backstage/backend-plugin-manager';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';

import { AapResourceEntityProvider } from '../providers';

export const dynamicPluginInstaller: BackendDynamicPluginInstaller = {
  kind: 'new',

  install: createBackendModule({
    moduleId: 'catalog-backend-module-aap',
    pluginId: 'catalog',
    register(env) {
      env.registerInit({
        deps: {
          catalog: catalogProcessingExtensionPoint,
          config: coreServices.rootConfig,
          logger: coreServices.logger,
          scheduler: coreServices.scheduler,
        },
        async init({ catalog, config, logger, scheduler }) {
          catalog.addEntityProvider(
            AapResourceEntityProvider.fromConfig(config, {
              logger: loggerToWinstonLogger(logger),
              schedule: scheduler.createScheduledTaskRunner({
                frequency: { minutes: 30 },
                timeout: { minutes: 3 },
              }),
              scheduler: scheduler,
            }),
          );
        },
      });
    },
  }),
};
