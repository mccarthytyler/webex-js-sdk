import {max, mean} from 'lodash';
import {
  AUDIO_RECV,
  AUDIO_SEND,
  AUDIO_SHARE_RECV,
  AUDIO_SHARE_SEND,
  VIDEO_RECV,
  VIDEO_SEND,
  VIDEO_SHARE_RECV,
  VIDEO_SHARE_SEND,
} from './constants';

export const isAudioSend = (mediaType: string): boolean => mediaType.includes(AUDIO_SEND);
export const isAudioShareSend = (mediaType: string): boolean =>
  mediaType.includes(AUDIO_SHARE_SEND);
export const isAudioRecv = (mediaType: string): boolean => mediaType.includes(AUDIO_RECV);
export const isAudioShareRecv = (mediaType: string): boolean =>
  mediaType.includes(AUDIO_SHARE_RECV);
export const isVideoSend = (mediaType: string): boolean => mediaType.includes(VIDEO_SEND);
export const isVideoShareSend = (mediaType: string): boolean =>
  mediaType.includes(VIDEO_SHARE_SEND);
export const isVideoRecv = (mediaType: string): boolean => mediaType.includes(VIDEO_RECV);
export const isVideoShareRecv = (mediaType: string): boolean =>
  mediaType.includes(VIDEO_SHARE_RECV);

/**
 * Get the totals of a certain value from a certain media type.
 *
 * @param {object} stats - The large stats object.
 * @param {string} sendrecvType - "send" or "recv".
 * @param {string} baseMediaType - audio or video _and_ share or non-share.
 * @param {string} value - The value we want to get the totals of.
 * @returns {number}
 */
export const getTotalValueFromBaseType = (
  stats: object,
  sendrecvType: string,
  baseMediaType: string,
  value: string
): number =>
  Object.keys(stats)
    .filter((mt) => mt.includes(baseMediaType))
    .reduce((acc, mt) => acc + (stats[mt]?.[sendrecvType]?.[value] || 0), 0);

/**
 * Get all values from a certain media type and push to a new array.
 *
 * @param {object} stats - The large stats object.
 * @param {string} sendrecvType - "send" or "recv".
 * @param {string} baseMediaType - audio or video _and_ share or non-share.
 * @param {string} value - The value we want to get the totals of.
 * @returns {number}
 */
export const getTotalValueFromBaseTypeArray = (
  stats: object,
  sendrecvType: string,
  baseMediaType: string,
  value: string
): number[] =>
  Object.keys(stats)
    .filter((mt) => mt.includes(baseMediaType))
    .reduce((acc, mt) => acc.concat(stats[mt]?.[sendrecvType]?.[value]), []);

export const isMainMediaType = (mediaType: string) => !mediaType.includes('-share');

export const getMediaTypeDirection = (statsResults: object, baseMediaType: string) =>
  statsResults[Object.keys(statsResults).find((mediaType) => mediaType.includes(baseMediaType))]
    ?.direction || 'inactive';

export const getFecRecovered = (
  fecPacketsReceived: number,
  lastFecPacketsReceived: number,
  fecPacketsDiscarded: number,
  lastFecPacketsDiscarded: number
) => fecPacketsReceived - lastFecPacketsReceived - (fecPacketsDiscarded - lastFecPacketsDiscarded);

export const getBitrate = (bytes: number | undefined) => (bytes ? (bytes * 8) / 60 : 0);

export const getRtpPackets = (packets: number, lastPackets: number) => packets - lastPackets;

export const getCsi = (statsResults: object, mediaType: string, stream: any) => {
  const {csi} = statsResults[mediaType];
  if (csi && !stream.common.csi.includes(csi)) {
    stream.common.csi.push(csi);
  }
};

export const getMax = (values: number[]) => max(values) * 1000 || 0;
export const getMean = (values: number[]) => mean(values) * 1000 || 0;
