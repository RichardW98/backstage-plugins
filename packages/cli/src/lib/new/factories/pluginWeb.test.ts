/*
 * Copyright 2021 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import fs from 'fs-extra';
import mockFs from 'mock-fs';

import { resolve as resolvePath, sep } from 'path';

import { paths } from '../../paths';
import { Task } from '../../tasks';
import { FactoryRegistry } from '../FactoryRegistry';
import { createMockOutputStream, mockPaths } from './common/testUtils';
import { pluginWeb } from './pluginWeb';

describe('pluginWeb factory', () => {
  beforeEach(() => {
    mockPaths({
      targetRoot: '/root',
    });
  });

  afterEach(() => {
    mockFs.restore();
    jest.resetAllMocks();
  });

  it('should create a react plugin package', async () => {
    mockFs({
      '/root': {
        plugins: mockFs.directory(),
      },
      [paths.resolveOwn('templates')]: mockFs.load(
        paths.resolveOwn('templates'),
      ),
    });

    const options = await FactoryRegistry.populateOptions(pluginWeb, {
      id: 'test',
    });

    let modified = false;

    const [output, mockStream] = createMockOutputStream();
    jest.spyOn(process, 'stderr', 'get').mockReturnValue(mockStream);
    jest.spyOn(Task, 'forCommand').mockResolvedValue();

    await pluginWeb.create(options, {
      private: true,
      isMonoRepo: true,
      defaultVersion: '1.0.0',
      markAsModified: () => {
        modified = true;
      },
      createTemporaryDirectory: () => fs.mkdtemp('test'),
    });

    expect(modified).toBe(true);

    expect(output).toEqual([
      '',
      'Creating web plugin library backstage-plugin-test-react',
      'Checking Prerequisites:',
      `availability  plugins${sep}test-react`,
      'creating      temp dir',
      'Executing Template:',
      'copying       .eslintrc.js',
      'templating    README.md.hbs',
      'templating    package.json.hbs',
      'templating    index.ts.hbs',
      'copying       setupTests.ts',
      'copying       index.ts',
      'copying       ExampleComponent.test.tsx',
      'copying       ExampleComponent.tsx',
      'copying       index.ts',
      'copying       index.ts',
      'copying       index.ts',
      'copying       useExample.ts',
      'Installing:',
      `moving        plugins${sep}test-react`,
    ]);

    await expect(
      fs.readJson('/root/plugins/test-react/package.json'),
    ).resolves.toEqual(
      expect.objectContaining({
        name: 'backstage-plugin-test-react',
        description: 'Web library for the test plugin',
        private: true,
        version: '1.0.0',
      }),
    );

    expect(Task.forCommand).toHaveBeenCalledTimes(2);
    expect(Task.forCommand).toHaveBeenCalledWith('yarn install', {
      cwd: resolvePath('/root/plugins/test-react'),
      optional: true,
    });
    expect(Task.forCommand).toHaveBeenCalledWith('yarn lint --fix', {
      cwd: resolvePath('/root/plugins/test-react'),
      optional: true,
    });
  });
});
