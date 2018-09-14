
const mapAction = (map, state, action) => {
  if (typeof map === 'function') {
    return map(state, action)
  } else {
    return map[action.type](state, action)
  }
}

const logEvent = (instance, event) => {
  if (typeof event === 'string') {
    instance.logEvent(event)
  } else {
    instance.logEvent(event.name, event)
  }
}

const isEvent = o => {
  return (
    typeof o === 'string' ||
    (typeof o === 'object' && typeof o.name === 'string') // object with a name
  )
}

const createAmplitudeMiddleware = (
  instance, // amplitude instance
  map // either object, or function action -> event | [event]
) => {
  return store => next => action => {
    const events = mapAction(map, store.getState(), action)
    if (Array.isArray(events)) {
      events.forEach(e => {
        if (isEvent(e)) {
          logEvent(instance, e)
        } else {
          emitWarning('Action mapped to something that is not an event:', action, e)
        }
      })
    } else if (isEvent(events)) {
      logEvent(instance, events)
    }
    return next(action)
  }
}

export {
  createAmplitudeMiddleware
}

const emitWarning = (msg, action, evt) => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`${msg}:\n action: ${action}, event: ${evt}`)
  }
}
