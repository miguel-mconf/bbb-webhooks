import { open } from 'node:fs/promises';
import { fileURLToPath } from 'url';
const MAPPED_EVENTS_PATH = fileURLToPath(
  new URL('../../example/events/mapped-events.json', import.meta.url)
);

const validEvents = [
  'chat-group-message-sent',
  'meeting-created',
  'meeting-ended',
  'meeting-screenshare-started',
  'meeting-screenshare-stopped',
  'poll-started',
  'poll-responded',
  'user-audio-muted',
  'user-audio-unmuted',
  'user-audio-voice-disabled',
  'user-audio-voice-enabled',
  'user-joined',
  'user-left',
  'user-cam-broadcast-end',
  'user-cam-broadcast-start',
  'user-raise-hand-changed'
]

const mapSamplesToEvents = async () => {
  const eventList = [];
  const mHandle = await open(MAPPED_EVENTS_PATH, 'r');

  for await (const line of mHandle.readLines()) {
    const event = JSON.parse(line)
    if (validEvents.includes(event.data.id)){
      eventList.push(event);
    }
  }

  await mHandle.close();

  return eventList;
}

const validators = {
  'meeting-created': (event, statement) => {
    return statement.verb.id === 'http://adlnet.gov/expapi/verbs/initialized';
  },
  'meeting-ended': (event, statement) => {
    return statement.verb.id === 'http://adlnet.gov/expapi/verbs/terminated';
  },
  'user-joined': (event, statement) => {
    return statement.verb.id === 'http://activitystrea.ms/join';
  },
  'user-left': (event, statement) => {
    return statement.verb.id === 'http://activitystrea.ms/leave';
  },
  'user-audio-voice-enabled': (event, statement) => {
    return statement.verb.id === 'http://activitystrea.ms/start';
  },
  'user-audio-voice-disabled': (event, statement) => {
    return statement.verb.id === 'https://w3id.org/xapi/virtual-classroom/verbs/stopped';
  },
  'user-audio-muted': (event, statement) => {
    return statement.verb.id === 'https://w3id.org/xapi/virtual-classroom/verbs/stopped';
  },
  'user-audio-unmuted': (event, statement) => {
    return statement.verb.id === 'http://activitystrea.ms/start';
  },
  'user-cam-broadcast-start': (event, statement) => {
    return statement.verb.id === 'http://activitystrea.ms/start';
  },
  'user-cam-broadcast-end': (event, statement) => {
    return statement.verb.id === 'https://w3id.org/xapi/virtual-classroom/verbs/stopped';
  },
  'meeting-screenshare-started': (event, statement) => {
    return statement.verb.id === 'http://activitystrea.ms/share';
  },
  'meeting-screenshare-stopped': (event, statement) => {
    return statement.verb.id === 'http://activitystrea.ms/unshare';
  },
  'chat-group-message-sent': (event, statement) => {
    return statement.verb.id === 'https://w3id.org/xapi/acrossx/verbs/posted';
  },
  'poll-started': (event, statement) => {
    return statement.verb.id === 'http://adlnet.gov/expapi/verbs/asked';
  },
  'poll-responded': (event, statement) => {
    return statement.verb.id === 'http://adlnet.gov/expapi/verbs/answered';
  },
  'user-raise-hand-changed': (event, statement) => {
    const raisedHandVerb = "https://w3id.org/xapi/virtual-classroom/verbs/reacted";
    const loweredHandVerb = "https://w3id.org/xapi/virtual-classroom/verbs/unreacted";
    const isRaiseHand = event.data.attributes.user["raise-hand"];
    return statement.verb.id === isRaiseHand ? raisedHandVerb : loweredHandVerb;
  }
}

const validate = (event, statement) => {
  const eventId = event.data.id;
  const validator = validators[eventId];

  if (!validator) throw new Error(`No validator for ${statement.verb.id}`);

  return validator(event, statement);
}

export {
  mapSamplesToEvents,
  validators,
  validate,
};
