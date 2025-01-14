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

import { Db, MongoClient } from 'mongodb'

export const up = async (db: Db, client: MongoClient) => {
  await db.createCollection('Location_view_with_plain_ids', {
    viewOn: 'Location',
    pipeline: [
      {
        $addFields: {
          'partOf.reference': {
            $cond: {
              if: {
                $regexMatch: {
                  input: '$partOf.reference',
                  regex: /^Location\//
                }
              },
              then: {
                $replaceOne: {
                  input: '$partOf.reference',
                  find: 'Location/',
                  replacement: ''
                }
              },
              else: '$partOf.reference'
            }
          }
        }
      }
    ]
  })
}

export const down = async (db: Db, client: MongoClient) => {
  await db.dropCollection('Location_view_with_plain_ids')
}
