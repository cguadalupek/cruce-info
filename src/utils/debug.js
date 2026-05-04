const PREFIX = "[CruceInfo]";

export function debugInfo(message, payload) {
  if (payload === undefined) {
    console.log(`${PREFIX} ${message}`);
    return;
  }

  console.log(`${PREFIX} ${message}`, payload);
}

export function debugWarn(message, payload) {
  if (payload === undefined) {
    console.warn(`${PREFIX} ${message}`);
    return;
  }

  console.warn(`${PREFIX} ${message}`, payload);
}

export function debugError(message, error) {
  console.error(`${PREFIX} ${message}`, error);
}

export function debugGroup(label, callback) {
  console.groupCollapsed(`${PREFIX} ${label}`);
  try {
    callback();
  } finally {
    console.groupEnd();
  }
}

export function errorToDebugPayload(error) {
  if (!(error instanceof Error)) {
    return { value: error };
  }

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    cause: error.cause,
  };
}
