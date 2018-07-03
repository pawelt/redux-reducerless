const { expect } = require('chai');
const { createStore, applyMiddleware, combineReducers, compose } = require('redux');
const { createStoreSection, deepFreeze } = require('../dist');
const { section1Defaults } = require('./defaults');

const initStore = (reducers, middlewares = []) => {
    const reducerMap = reducers.reduce((res, reducer) => ({ ...res, ...reducer }), {});
    return createStore(combineReducers(reducerMap), compose(applyMiddleware(...middlewares)));
};

describe('update actions', () => {
    it('have correct type', () => {
        const { update } = createStoreSection('section1', section1Defaults);
        const payload = { a1: undefined, a2: { a21: 789 } };

        const unnamedAction = update(payload);
        expect(unnamedAction.type).equal('section1 ~> [ a1,a2 ]');

        const namedAction = update(payload, 'some name');
        expect(namedAction.type).equal('section1 ~> some name [ a1,a2 ]');
    });

    it('build correct payload', () => {
        const { update } = createStoreSection('section1', section1Defaults);
        const payload = { a1: undefined, a2: { a21: 789 } };
        const action1 = update(payload);

        // update action uses empty state as base,
        // so anything passed to update() is used for payload as-is
        const expectedPayload = Object.assign({}, payload);
        expect(action1.payload).eql(expectedPayload);
    });
});

describe('replace actions', () => {
    it('have correct type', () => {
        const { replace } = createStoreSection('section1');

        const unnamedAction = replace({ a: [] });
        expect(unnamedAction.type).equal('section1 => [ a ]');

        const namedAction = replace({ a: [] }, 'some name');
        expect(namedAction.type).equal('section1 => some name [ a ]');
    });

    it('build correct payload', () => {
        const { replace } = createStoreSection('section1', section1Defaults);
        const payload = { a1: undefined, a2: { a21: 789 } };
        const action1 = replace(payload);

        // Replace action uses the default state as base,
        // and merges action payload with the initial state using Object.assign().
        // This allows to reset first level fields of the store section to defaults,
        // by passing undefined as value (like in case of a1 field above)
        const expectedPayload = Object.assign({}, payload, {
            a1: section1Defaults.a1,
        });
        expect(action1.payload).eql(expectedPayload);
    });
});

describe('selectors', () => {
    it('select the correct store section', () => {
        const { reducer, select } = createStoreSection('section1', section1Defaults);
        const store = initStore([reducer]);
        const sselectedState = select(store.getState());
        const expectedState = store.getState().section1;
        expect(sselectedState).equal(expectedState);
    });
});

describe('reducers', () => {
    it('generate correct state with update actions', () => {
        const { reducer, select, update } = createStoreSection('section1', section1Defaults);
        const store = initStore([reducer]);

        const oldState = deepFreeze(select(store.getState()));
        store.dispatch(
            update({
                a1: undefined,
                a2: { a21: 666 },
            })
        );
        const newState = select(store.getState());

        // a1 was explicitly removed
        expect(newState).not.to.have.property('a1');

        // a2 should be modified, because it is a parent of a22, which was explicitly changed
        expect(newState.a2).not.to.equal(oldState.a2);

        // a21 has a new value, explicitly set
        expect(newState.a2.a21).to.equal(666);

        // this was not touched, as a22 was not a part of the dispatched  payload
        expect(newState.a2.a22).to.equal(oldState.a2.a22);

        // top level fields not defined in the payload are not affected
        expect(newState.a3).to.eql(oldState.a3);
        expect(newState.a3).to.equal(oldState.a3);
    });

    it('generate correct state with replace actions', () => {
        const { reducer, select, replace } = createStoreSection('section1', section1Defaults);
        const store = initStore([reducer]);

        const oldState = deepFreeze(select(store.getState()));
        store.dispatch(
            replace({
                a1: undefined,
                a2: { a21: 666 },
            })
        );
        const newState = select(store.getState());

        // a1 was set to undefined, so the result value got restored from defaults
        expect(newState.a1).to.equal(section1Defaults.a1);

        // a2 should be modified, because it is a parent of a22, which was explicitly changed
        expect(newState.a2).not.to.equal(oldState.a2);

        // a21 has a new value, explicitly set
        expect(newState.a2.a21).to.equal(666);

        // a2 was explicitly set to { a21: 666 }, which does not contain a22 field
        expect(newState.a2).to.not.have.property('a22');

        // in other words, the whole a2 field was replaced with the cvalue from the payload
        expect(newState.a2).to.eql({ a21: 666 });

        // top level fields not defined in the payload are not affected
        expect(newState.a3).to.eql(oldState.a3);
        expect(newState.a3).to.equal(oldState.a3);
    });
});
