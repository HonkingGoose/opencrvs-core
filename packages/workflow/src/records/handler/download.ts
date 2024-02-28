/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * OpenCRVS is also distributed under the terms of the Civil Registration
 * & Healthcare Disclaimer located at http://opencrvs.org/license.
 *
 * Copyright (C) The OpenCRVS Authors located at https://github.com/opencrvs/opencrvs-core/blob/master/AUTHORS.
 */
import {
  getStatusFromTask,
  getTaskFromSavedBundle,
  TaskStatus,
  ValidRecord
} from '@opencrvs/commons/types'
import * as Hapi from '@hapi/hapi'
import * as z from 'zod'
import { validateRequest } from '@workflow/utils/index'
import { getValidRecordById } from '@workflow/records/index'
import { getToken } from '@workflow/utils/authUtils'
import { IAuthHeader } from '@opencrvs/commons'
import { toDownloaded } from '@workflow/records/state-transitions'
import { getSystem, getUser } from '@workflow/features/user/utils'
import {
  getTokenPayload,
  hasScope,
  inScope
} from '@opencrvs/commons/authentication'
import { sendBundleToHearth } from '@workflow/records/fhir'
import { indexBundleForAssignment } from '@workflow/records/search'
import { ISystemModelData, IUserModelData } from '@workflow/records/user'
import { logger } from '@workflow/logger'

function getDownloadedOrAssignedExtension(
  authHeader: IAuthHeader,
  status: TaskStatus
) {
  if (
    inScope(authHeader, ['declare', 'recordsearch']) ||
    (hasScope(authHeader, 'validate') && status === 'VALIDATED')
  ) {
    return `http://opencrvs.org/specs/extension/regDownloaded` as const
  }
  return `http://opencrvs.org/specs/extension/regAssigned` as const
}

export async function downloadRecordHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const payload = validateRequest(
    z.object({
      id: z.string()
    }),
    request.payload
  )

  const token = getToken(request)
  const tokenPayload = getTokenPayload(token)
  // Task history is fetched rather than the task only
  const record = await getValidRecordById(payload.id, token, true)

  const task = getTaskFromSavedBundle(record)
  const businessStatus = getStatusFromTask(task)

  if (!businessStatus) {
    throw new Error("Task didn't have any status. This should never happen")
  }

  const isRecordSearch = hasScope(
    { Authorization: `Bearer ${token}` },
    'recordsearch'
  )

  const user: IUserModelData | ISystemModelData = !isRecordSearch
    ? await getUser(tokenPayload.sub, {
        Authorization: `Bearer ${token}`
      })
    : await getSystem(tokenPayload.sub, {
        Authorization: `Bearer ${token}`
      })

  const extensionUrl = getDownloadedOrAssignedExtension(
    { Authorization: `Bearer ${token}` },
    businessStatus
  )

  const { downloadedRecord, downloadedRecordWithTaskOnly } = await toDownloaded(
    record,
    user,
    extensionUrl
  )

  /*
   * Storing the details of the downloaded record in the database(s) is slow.
   * So we return the requested record to the requesting users optimistically immediately.
   * The time difference is 50ms when not waiting and 1000ms when waiting.
   */
  process.nextTick(async () => {
    try {
      // Here the sent bundle is saved with task only
      await sendBundleToHearth(downloadedRecordWithTaskOnly)

      await indexBundleForAssignment(
        downloadedRecordWithTaskOnly,
        token,
        '/events/assigned'
      )
    } catch (error) {
      logger.error(error)
    }
  })

  return downloadedRecord as ValidRecord
}