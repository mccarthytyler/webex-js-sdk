import {STATS} from '../constants';
import {
  getBitrate,
  getCsi,
  getFecRecovered,
  getMax,
  getMean,
  getMediaTypeDirection,
  getRtpPackets,
  getTotalValueFromBaseType,
  getTotalValueFromBaseTypeArray,
  isMainMediaType,
} from './util';

export const getAudioReceiverMqa = ({
  audioReceiver,
  statsResults,
  lastMqaDataSent,
  baseMediaType,
}) => {
  const sendrecvType = STATS.RECEIVE_DIRECTION;

  const getLastTotalValue = (value: string) =>
    getTotalValueFromBaseType(lastMqaDataSent, sendrecvType, baseMediaType, value);
  const getTotalValue = (value: string) =>
    getTotalValueFromBaseType(statsResults, sendrecvType, baseMediaType, value);

  const lastPacketsReceived = getLastTotalValue('totalPacketsReceived');
  const lastPacketsLost = getLastTotalValue('totalPacketsLost');
  const lastBytesReceived = getLastTotalValue('totalBytesReceived');
  const lastFecPacketsReceived = getLastTotalValue('fecPacketsReceived');
  const lastFecPacketsDiscarded = getLastTotalValue('fecPacketsDiscarded');

  const totalPacketsReceived = getTotalValue('totalPacketsReceived');
  const packetsLost = getTotalValue('totalPacketsLost');
  const totalBytesReceived = getTotalValue('totalBytesReceived');
  const totalFecPacketsReceived = getTotalValue('fecPacketsReceived');
  const totalFecPacketsDiscarded = getTotalValue('fecPacketsDiscarded');

  audioReceiver.common.common.direction = getMediaTypeDirection(statsResults, baseMediaType);
  audioReceiver.common.common.isMain = isMainMediaType(baseMediaType);
  audioReceiver.common.transportType = statsResults.connectionType.local.transport;

  // add rtpPacket info inside common as also for call analyzer
  audioReceiver.common.rtpPackets = getRtpPackets(totalPacketsReceived, lastPacketsReceived);

  // Hop by hop are numbers and not percentage so we compare on what we sent the last min
  // collect the packets received for the last min
  const totalPacketsLost = packetsLost - lastPacketsLost;
  audioReceiver.common.mediaHopByHopLost = totalPacketsLost;
  audioReceiver.common.rtpHopByHopLost = totalPacketsLost;

  audioReceiver.common.fecPackets = getFecRecovered(
    totalFecPacketsReceived,
    lastFecPacketsReceived,
    totalFecPacketsDiscarded,
    lastFecPacketsDiscarded
  );

  audioReceiver.common.rtpBitrate = getBitrate(totalBytesReceived - lastBytesReceived);
};

export const getAudioReceiverStreamMqa = ({
  audioReceiverStream,
  statsResults,
  lastMqaDataSent,
  mediaType,
}) => {
  const sendrecvType = STATS.RECEIVE_DIRECTION;

  const lastPacketsDecoded = lastMqaDataSent[mediaType]?.[sendrecvType].totalSamplesDecoded || 0;
  const lastSamplesReceived = lastMqaDataSent[mediaType]?.[sendrecvType].totalSamplesReceived || 0;
  const lastConcealedSamples = lastMqaDataSent[mediaType]?.[sendrecvType].concealedSamples || 0;
  const lastBytesReceived = lastMqaDataSent[mediaType]?.[sendrecvType].totalBytesReceived || 0;
  const lastFecPacketsReceived = lastMqaDataSent[mediaType]?.[sendrecvType].fecPacketsReceived || 0;
  const lastFecPacketsDiscarded =
    lastMqaDataSent[mediaType]?.[sendrecvType].fecPacketsDiscarded || 0;
  const lastPacketsReceived = lastMqaDataSent[mediaType]?.[sendrecvType].totalPacketsReceived || 0;
  const lastPacketsLost = lastMqaDataSent[mediaType]?.[sendrecvType].totalPacketsLost || 0;

  getCsi(statsResults, mediaType, audioReceiverStream);

  audioReceiverStream.common.rtpPackets = getRtpPackets(
    statsResults[mediaType][sendrecvType].totalPacketsReceived,
    lastPacketsReceived
  );

  audioReceiverStream.common.maxRtpJitter = getMax(
    statsResults[mediaType][sendrecvType].meanRtpJitter
  );
  audioReceiverStream.common.meanRtpJitter = getMean(
    statsResults[mediaType][sendrecvType].meanRtpJitter
  );
  audioReceiverStream.common.rtpJitter = audioReceiverStream.common.maxRtpJitter;

  // Fec packets do come in as part of the FEC only for audio
  const fecRecovered = getFecRecovered(
    statsResults[mediaType][sendrecvType].fecPacketsReceived,
    lastFecPacketsReceived,
    statsResults[mediaType][sendrecvType].fecPacketsDiscarded,
    lastFecPacketsDiscarded
  );

  audioReceiverStream.common.rtpEndToEndLost =
    statsResults[mediaType][sendrecvType].totalPacketsLost - lastPacketsLost - fecRecovered || 0;

  audioReceiverStream.common.framesDropped =
    statsResults[mediaType][sendrecvType].totalSamplesDecoded - lastPacketsDecoded || 0;
  audioReceiverStream.common.renderedFrameRate =
    (audioReceiverStream.common.framesDropped * 100) / 60 || 0;

  audioReceiverStream.common.framesReceived =
    statsResults[mediaType][sendrecvType].totalSamplesReceived - lastSamplesReceived || 0;
  audioReceiverStream.common.concealedFrames =
    statsResults[mediaType][sendrecvType].concealedSamples - lastConcealedSamples || 0;
  audioReceiverStream.common.receivedBitrate = getBitrate(
    statsResults[mediaType][sendrecvType].totalBytesReceived - lastBytesReceived
  );
};

export const getAudioSenderMqa = ({audioSender, statsResults, lastMqaDataSent, baseMediaType}) => {
  const sendrecvType = STATS.SEND_DIRECTION;

  const getLastTotalValue = (value: string) =>
    getTotalValueFromBaseType(lastMqaDataSent, sendrecvType, baseMediaType, value);
  const getTotalValue = (value: string) =>
    getTotalValueFromBaseType(statsResults, sendrecvType, baseMediaType, value);

  const lastPacketsSent = getLastTotalValue('totalPacketsSent');
  const lastPacketsLostTotal = getLastTotalValue('totalPacketsLostOnReceiver');

  const totalPacketsLostOnReceiver = getTotalValue('totalPacketsLostOnReceiver');
  const totalPacketsSent = getTotalValue('totalPacketsSent');

  const meanRemoteJitter = getTotalValueFromBaseTypeArray(
    statsResults,
    sendrecvType,
    baseMediaType,
    'meanRemoteJitter'
  );
  const meanRoundTripTime = getTotalValueFromBaseTypeArray(
    statsResults,
    sendrecvType,
    baseMediaType,
    'meanRoundTripTime'
  );

  audioSender.common.common.direction = getMediaTypeDirection(statsResults, baseMediaType);
  audioSender.common.common.isMain = isMainMediaType(baseMediaType);
  audioSender.common.transportType = statsResults.connectionType.local.transport;

  audioSender.common.maxRemoteJitter = getMax(meanRemoteJitter);
  audioSender.common.meanRemoteJitter = getMean(meanRemoteJitter);

  audioSender.common.rtpPackets = getRtpPackets(totalPacketsSent, lastPacketsSent);

  // From candidate-pair
  audioSender.common.availableBitrate = getTotalValue('availableOutgoingBitrate');

  // Calculate based on how much packets lost of received compated to how to the client sent
  const totalPacketsLostForaMin = totalPacketsLostOnReceiver - lastPacketsLostTotal;
  audioSender.common.remoteLossRate =
    totalPacketsSent - lastPacketsSent > 0
      ? (totalPacketsLostForaMin * 100) / (totalPacketsSent - lastPacketsSent)
      : 0; // This is the packets sent with in last min

  audioSender.common.maxRoundTripTime = getMax(meanRoundTripTime);
  audioSender.common.meanRoundTripTime = getMean(meanRoundTripTime);
  audioSender.common.roundTripTime = audioSender.common.maxRoundTripTime;

  // Calculate the outgoing bitrate
  const totalBytesSentInaMin =
    getTotalValue('totalBytesSent') - getLastTotalValue('totalBytesSent');

  audioSender.common.rtpBitrate = getBitrate(totalBytesSentInaMin);
};

export const getAudioSenderStreamMqa = ({
  audioSenderStream,
  statsResults,
  lastMqaDataSent,
  mediaType,
}) => {
  const sendrecvType = STATS.SEND_DIRECTION;

  const lastBytesSent = lastMqaDataSent[mediaType]?.[sendrecvType].totalBytesSent || 0;
  const lastFramesEncoded = lastMqaDataSent[mediaType]?.[sendrecvType].totalKeyFramesEncoded || 0;
  const lastFirCount = lastMqaDataSent[mediaType]?.[sendrecvType].totalFirCount || 0;
  const lastPacketsSent = lastMqaDataSent[mediaType]?.[sendrecvType].totalPacketsSent || 0;

  getCsi(statsResults, mediaType, audioSenderStream);

  audioSenderStream.common.rtpPackets = getRtpPackets(
    statsResults[mediaType][sendrecvType].totalPacketsSent,
    lastPacketsSent
  );

  audioSenderStream.common.transmittedBitrate = getBitrate(
    statsResults[mediaType][sendrecvType].totalBytesSent - lastBytesSent
  );

  audioSenderStream.transmittedKeyFrames =
    statsResults[mediaType][sendrecvType].totalKeyFramesEncoded - lastFramesEncoded || 0;
  audioSenderStream.requestedKeyFrames =
    statsResults[mediaType][sendrecvType].totalFirCount - lastFirCount || 0;
};

export const getVideoReceiverMqa = ({
  videoReceiver,
  statsResults,
  lastMqaDataSent,
  baseMediaType,
}) => {
  const sendrecvType = STATS.RECEIVE_DIRECTION;

  const getLastTotalValue = (value: string) =>
    getTotalValueFromBaseType(lastMqaDataSent, sendrecvType, baseMediaType, value);
  const getTotalValue = (value: string) =>
    getTotalValueFromBaseType(statsResults, sendrecvType, baseMediaType, value);

  const lastPacketsReceived = getLastTotalValue('totalPacketsReceived');
  const lastPacketsLost = getLastTotalValue('totalPacketsLost');
  const lastBytesReceived = getLastTotalValue('totalBytesReceived');

  const packetsLost = getTotalValue('totalPacketsLost');
  const totalPacketsReceived = getTotalValue('totalPacketsReceived');
  const totalBytesReceived = getTotalValue('totalBytesReceived');

  const meanRemoteJitter = getTotalValueFromBaseTypeArray(
    statsResults,
    sendrecvType,
    baseMediaType,
    'meanRemoteJitter'
  );

  videoReceiver.common.common.direction = getMediaTypeDirection(statsResults, baseMediaType);
  videoReceiver.common.common.isMain = isMainMediaType(baseMediaType);
  videoReceiver.common.transportType = statsResults.connectionType.local.transport;

  // collect the packets received for the last min
  videoReceiver.common.rtpPackets = getRtpPackets(totalPacketsReceived, lastPacketsReceived);

  // Hop by hop are numbers and not percentage so we compare on what we sent the last min
  // this is including packet lost
  const totalPacketsLost = packetsLost - lastPacketsLost;
  videoReceiver.common.mediaHopByHopLost = totalPacketsLost;
  videoReceiver.common.rtpHopByHopLost = totalPacketsLost;

  // calculate this values
  videoReceiver.common.maxRemoteJitter = getMax(meanRemoteJitter);
  videoReceiver.common.meanRemoteJitter = getMean(meanRemoteJitter);

  // Calculate the outgoing bitrate
  videoReceiver.common.rtpBitrate = getBitrate(totalBytesReceived - lastBytesReceived);
};

export const getVideoReceiverStreamMqa = ({
  videoReceiverStream,
  statsResults,
  lastMqaDataSent,
  mediaType,
}) => {
  const sendrecvType = STATS.RECEIVE_DIRECTION;

  const lastPacketsReceived = lastMqaDataSent[mediaType]?.[sendrecvType].totalPacketsReceived || 0;
  const lastPacketsLost = lastMqaDataSent[mediaType]?.[sendrecvType].totalPacketsLost || 0;
  const lastBytesReceived = lastMqaDataSent[mediaType]?.[sendrecvType].totalBytesReceived || 0;
  const lastFramesReceived = lastMqaDataSent[mediaType]?.[sendrecvType].framesReceived || 0;
  const lastFramesDecoded = lastMqaDataSent[mediaType]?.[sendrecvType].framesDecoded || 0;
  const lastFramesDropped = lastMqaDataSent[mediaType]?.[sendrecvType].framesDropped || 0;
  const lastKeyFramesDecoded = lastMqaDataSent[mediaType]?.[sendrecvType].keyFramesDecoded || 0;
  const lastPliCount = lastMqaDataSent[mediaType]?.[sendrecvType].totalPliCount || 0;

  getCsi(statsResults, mediaType, videoReceiverStream);

  videoReceiverStream.common.rtpPackets = getRtpPackets(
    statsResults[mediaType][sendrecvType].totalPacketsReceived,
    lastPacketsReceived
  );

  const totalPacketLoss =
    statsResults[mediaType][sendrecvType].totalPacketsLost - lastPacketsLost || 0;

  // End to end packetloss is after recovery
  videoReceiverStream.common.rtpEndToEndLost = totalPacketLoss;

  videoReceiverStream.common.rtpJitter = getMax(
    statsResults[mediaType][sendrecvType].meanRemoteJitter
  );

  videoReceiverStream.common.receivedBitrate = getBitrate(
    statsResults[mediaType][sendrecvType].totalBytesReceived - lastBytesReceived
  );

  const totalFrameReceivedInaMin =
    statsResults[mediaType][sendrecvType].framesReceived - lastFramesReceived;
  const totalFrameDecodedInaMin =
    statsResults[mediaType][sendrecvType].framesDecoded - lastFramesDecoded;

  videoReceiverStream.common.receivedFrameRate = Math.round(
    totalFrameReceivedInaMin ? totalFrameReceivedInaMin / 60 : 0
  );
  videoReceiverStream.common.renderedFrameRate = Math.round(
    totalFrameDecodedInaMin ? totalFrameDecodedInaMin / 60 : 0
  );

  videoReceiverStream.common.framesDropped =
    statsResults[mediaType][sendrecvType].framesDropped - lastFramesDropped || 0;
  videoReceiverStream.receivedHeight = statsResults[mediaType][sendrecvType].height || 0;
  videoReceiverStream.receivedWidth = statsResults[mediaType][sendrecvType].width || 0;
  videoReceiverStream.receivedFrameSize =
    (videoReceiverStream.receivedHeight * videoReceiverStream.receivedWidth) / 256;

  videoReceiverStream.receivedKeyFrames =
    statsResults[mediaType][sendrecvType].keyFramesDecoded - lastKeyFramesDecoded || 0;
  videoReceiverStream.requestedKeyFrames =
    statsResults[mediaType][sendrecvType].totalPliCount - lastPliCount || 0;
};

export const getVideoSenderMqa = ({videoSender, statsResults, lastMqaDataSent, baseMediaType}) => {
  const sendrecvType = STATS.SEND_DIRECTION;

  const getLastTotalValue = (value: string) =>
    getTotalValueFromBaseType(lastMqaDataSent, sendrecvType, baseMediaType, value);
  const getTotalValue = (value: string) =>
    getTotalValueFromBaseType(statsResults, sendrecvType, baseMediaType, value);

  const lastPacketsSent = getLastTotalValue('totalPacketsSent');
  const lastBytesSent = getLastTotalValue('totalBytesSent');
  const lastPacketsLostTotal = getLastTotalValue('totalPacketsLostOnReceiver');

  const totalPacketsLostOnReceiver = getTotalValue('totalPacketsLostOnReceiver');
  const totalPacketsSent = getTotalValue('totalPacketsSent');
  const totalBytesSent = getTotalValue('totalBytesSent');
  const availableOutgoingBitrate = getTotalValue('availableOutgoingBitrate');

  videoSender.common.common.direction = getMediaTypeDirection(statsResults, baseMediaType);
  videoSender.common.common.isMain = isMainMediaType(baseMediaType);
  videoSender.common.transportType = statsResults.connectionType.local.transport;

  const meanRemoteJitter = getTotalValueFromBaseTypeArray(
    statsResults,
    sendrecvType,
    baseMediaType,
    'meanRemoteJitter'
  );
  const meanRoundTripTime = getTotalValueFromBaseTypeArray(
    statsResults,
    sendrecvType,
    baseMediaType,
    'meanRoundTripTime'
  );

  videoSender.common.maxRemoteJitter = getMax(meanRemoteJitter);
  videoSender.common.meanRemoteJitter = getMean(meanRemoteJitter);

  videoSender.common.rtpPackets = getRtpPackets(totalPacketsSent, lastPacketsSent);
  videoSender.common.availableBitrate = availableOutgoingBitrate;

  // Calculate based on how much packets lost of received compated to how to the client sent
  const totalPacketsLostForaMin = totalPacketsLostOnReceiver - lastPacketsLostTotal;

  videoSender.common.remoteLossRate =
    totalPacketsSent - lastPacketsSent > 0
      ? (totalPacketsLostForaMin * 100) / (totalPacketsSent - lastPacketsSent)
      : 0; // This is the packets sent with in last min || 0;

  videoSender.common.maxRoundTripTime = getMax(meanRoundTripTime);
  videoSender.common.meanRoundTripTime = getMean(meanRoundTripTime);
  videoSender.common.roundTripTime = videoSender.common.maxRoundTripTime;

  // Calculate the outgoing bitrate
  const totalBytesSentInaMin = totalBytesSent - lastBytesSent;

  videoSender.common.rtpBitrate = getBitrate(totalBytesSentInaMin);
};

export const getVideoSenderStreamMqa = ({
  videoSenderStream,
  statsResults,
  lastMqaDataSent,
  mediaType,
}) => {
  const sendrecvType = STATS.SEND_DIRECTION;

  const lastPacketsSent = lastMqaDataSent[mediaType]?.[sendrecvType].totalPacketsSent || 0;
  const lastBytesSent = lastMqaDataSent[mediaType]?.[sendrecvType].totalBytesSent || 0;
  const lastKeyFramesEncoded =
    lastMqaDataSent[mediaType]?.[sendrecvType].totalKeyFramesEncoded || 0;
  const lastFirCount = lastMqaDataSent[mediaType]?.[sendrecvType].totalFirCount || 0;
  const lastFramesSent = lastMqaDataSent[mediaType]?.[sendrecvType].framesSent || 0;

  getCsi(statsResults, mediaType, videoSenderStream);

  videoSenderStream.common.rtpPackets = getRtpPackets(
    statsResults[mediaType][sendrecvType].totalPacketsSent,
    lastPacketsSent
  );

  videoSenderStream.common.transmittedBitrate = getBitrate(
    statsResults[mediaType][sendrecvType].totalBytesSent - lastBytesSent
  );

  videoSenderStream.transmittedKeyFrames =
    statsResults[mediaType][sendrecvType].totalKeyFramesEncoded - lastKeyFramesEncoded || 0;
  videoSenderStream.requestedKeyFrames =
    statsResults[mediaType][sendrecvType].totalFirCount - lastFirCount || 0;

  // From tracks //TODO: calculate a proper one
  const totalFrameSentInaMin =
    statsResults[mediaType][sendrecvType].framesSent - (lastFramesSent || 0);

  videoSenderStream.common.transmittedFrameRate = Math.round(
    totalFrameSentInaMin ? totalFrameSentInaMin / 60 : 0
  );
  videoSenderStream.transmittedHeight = statsResults[mediaType][sendrecvType].height || 0;
  videoSenderStream.transmittedWidth = statsResults[mediaType][sendrecvType].width || 0;
  videoSenderStream.transmittedFrameSize =
    (videoSenderStream.transmittedHeight * videoSenderStream.transmittedWidth) / 256;
};
