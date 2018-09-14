import { describe, it } from 'mocha'
import { expect } from 'chai'
import { createAmplitudeMiddleware } from '../index'
import { createStore, applyMiddleware } from 'redux'

describe('redux-amplitude-middleware', () => {
  it('works with a map function', () => {
    // get a handle to an amplitude instance
    const inst = createMockInstance()

    // write a function that maps state -> action -> event
    const mapFn = (state, action) => {
      return { name: 'UserDidThing', thing: action.type }
    }

    // create the amplitude middleware
    const mw = createAmplitudeMiddleware(inst, mapFn)

    // and pass it to the datastore
    const store = createMockStore(mw)

    // when we dispatch
    store.dispatch({ type: 'foo' })

    // we expect an event to have been logged
    expect(inst.eventLog).to.deep.eql([
      ['UserDidThing', { name: 'UserDidThing', thing: 'foo' }]
    ])
  })

  it('works with a map table', () => {
    // get a handle to an amplitude instance
    const inst = createMockInstance()

    // write a function that maps state -> action -> event
    const mapTbl = {
      UserDidThing: (state, action) => {
        return 'user-did-thing'
      },
      UserReadThing: (state, action) => {
        return 'user-read-thing'
      }
    }

    // create the amplitude middleware
    const mw = createAmplitudeMiddleware(inst, mapTbl)

    // and pass it to the datastore
    const store = createMockStore(mw)

    // when we dispatch
    store.dispatch({ type: 'UserReadThing' })
    store.dispatch({ type: 'UserDidThing' })

    // we expect an event to have been logged
    expect(inst.eventLog).to.deep.eql([
      ['user-read-thing', undefined],
      ['user-did-thing', undefined]
    ])
  })

  it('passes state and actions to map function', () => {
    // get a handle to an amplitude instance
    const inst = createMockInstance()

    let st = null
    let ac = null
    // write a function that maps state -> action -> event
    const mapFn = (state, action) => {
      st = state
      ac = action
      return 'some-event'
    }

    // create the amplitude middleware
    const mw = createAmplitudeMiddleware(inst, mapFn)

    // and pass it to the datastore
    const store = createMockStore(mw)

    store.dispatch({ type: 'foo' })

    expect(st).to.deep.eql(init())
    expect(ac).to.deep.eql({ type: 'foo' })
  })

  it('passes state and actions to map table callbacks', () => {
    // get a handle to an amplitude instance
    const inst = createMockInstance()

    let st = null
    let ac = null
    // write a function that maps state -> action -> event
    const mapTbl = {
      foo: (state, action) => {
        st = state
        ac = action
        return 'some-event'
      }
    }

    // create the amplitude middleware
    const mw = createAmplitudeMiddleware(inst, mapTbl)

    // and pass it to the datastore
    const store = createMockStore(mw)

    store.dispatch({ type: 'foo' })

    expect(st).to.deep.eql(init())
    expect(ac).to.deep.eql({ type: 'foo' })
  })

  it('map table callback can return multiple events to be logged', () => {
    // get a handle to an amplitude instance
    const inst = createMockInstance()

    // write a function that maps state -> action -> event
    const mapTbl = {
      foo: (state, action) => {
        return ['event-1', { name: 'event-2', something: 'else' }, 'event-3']
      }
    }

    // create the amplitude middleware
    const mw = createAmplitudeMiddleware(inst, mapTbl)

    // and pass it to the datastore
    const store = createMockStore(mw)

    store.dispatch({ type: 'foo' })

    // ['event-1', { name: 'event-2', something: 'else' }, 'event-3']
    expect(inst.eventLog).to.deep.eql([
      ['event-1', undefined],
      ['event-2', { name: 'event-2', something: 'else' }],
      ['event-3', undefined]
    ])
  })

  it('map function can return multiple events to be logged', () => {
    // get a handle to an amplitude instance
    const inst = createMockInstance()

    // write a function that maps state -> action -> event
    const mapFn = (state, action) => {
      return ['event-1', { name: 'event-2', something: 'else' }, 'event-3']
    }

    // create the amplitude middleware
    const mw = createAmplitudeMiddleware(inst, mapFn)

    // and pass it to the datastore
    const store = createMockStore(mw)

    store.dispatch({ type: 'foo' })

    // ['event-1', { name: 'event-2', something: 'else' }, 'event-3']
    expect(inst.eventLog).to.deep.eql([
      ['event-1', undefined],
      ['event-2', { name: 'event-2', something: 'else' }],
      ['event-3', undefined]
    ])
  })
})

const createMockInstance = () => {
  const eventLog = []
  return {
    eventLog,
    // this mocks the `logEvent` method on amplitude JS SDK
    logEvent: (name, props) => {
      eventLog.push([name, props])
    }
  }
}

const init = () => {
  return {
    items: [1, 2, 3]
  }
}

const reducer = (state = init()) => state

const createMockStore = mw =>
  createStore(reducer, applyMiddleware(mw))
