'use strict';

import { deepClone, deepFreeze, tracedUpdate } from './utils';

export {
    createStoreSection,
    tracedUpdate,
    deepClone,
    deepFreeze,
}

const UPDATE_MARK = ' ~> ';
const REPLACE_MARK = ' => ';

/**
 * Creates a section of a redux store
 * @param {*} storePath
 * @param {*} initialState
 */
function createStoreSection(storePath, initialState = {}) {
    return {
        reducer: newReducer(storePath, initialState),
        select: newPathSelector(storePath),
        update: newActionCreator(storePath, {}, UPDATE_MARK),
        replace: newActionCreator(storePath, initialState, REPLACE_MARK),
    };
}

function newReducer(storePath, initialState) {
    const isType = (type, typeMark) => type.startsWith(getActionType(storePath, typeMark));
    return {
        [storePath]: (state = initialState, { type, payload }) => {
            if (isType(type, UPDATE_MARK)) return tracedUpdate(state, payload);
            if (isType(type, REPLACE_MARK)) return Object.assign({}, state, payload);
            return state;
        },
    };
}

function newPathSelector(storePath) {
    return state => state[storePath];
}

function newActionCreator(storePath, baseState, typeMark) {
    return (stateChange, actionTitle = '') => {
        const typeTile = `${actionTitle} [ ${Object.keys(stateChange)} ]`.trim();
        const type = getActionType(storePath, typeMark, typeTile);
        const payload = getActionPayload(stateChange, baseState);
        return { type, payload };
    };
}

function getActionType(storePath, typeMark, typeTitle = '') {
    return storePath + typeMark + typeTitle;
}

function getActionPayload(stateChange, baseState) {
    const payload = {};
    for (let k in stateChange) {
        payload[k] = stateChange[k] !== void 0 ? stateChange[k] : baseState[k];
    }
    return payload;
}
