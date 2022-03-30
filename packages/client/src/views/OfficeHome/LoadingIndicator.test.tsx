/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * OpenCRVS is also distributed under the terms of the Civil Registration
 * & Healthcare Disclaimer located at http://opencrvs.org/license.
 *
 * Copyright (C) The OpenCRVS Authors. OpenCRVS and the OpenCRVS
 * graphic logo are (registered/a) trademark(s) of Plan International.
 */
import * as React from 'react'
import { LoadingIndicator } from './LoadingIndicator'
import { createTestComponent } from '@client/tests/util'
import { createStore } from '@client/store'

describe('LoadingIndicator test cases', () => {
  const { store, history } = createStore()

  it('Should display the Loading text', async () => {
    // @ts-ignore
    const testComponent = await createTestComponent(
      <LoadingIndicator
        loading={true}
        hasError={false}
        noDeclaration={false}
      />,
      { store, history }
    )
    const isShowingLoadingText = testComponent.find('span#loading-text').length
    expect(isShowingLoadingText).toBe(1)
  })

  it('Should display the Error', async () => {
    // @ts-ignore
    const testComponent = await createTestComponent(
      <LoadingIndicator
        loading={false}
        hasError={true}
        noDeclaration={false}
      />,
      { store, history }
    )
    const isShowingLoadingText = testComponent.find(
      'div#search-result-error-text-count'
    ).length
    expect(isShowingLoadingText).toBe(1)
  })

  it('Should display No declaration', async () => {
    // @ts-ignore
    const testComponent = await createTestComponent(
      <LoadingIndicator
        loading={false}
        hasError={false}
        noDeclaration={true}
      />,
      { store, history }
    )
    const isShowingLoadingText = testComponent.find(
      'span#no-declaration-text'
    ).length
    expect(isShowingLoadingText).toBe(1)
  })
})