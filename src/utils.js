export {
    deepFreeze,
    deepClone,
    tracedUpdate,
}

/**
 * Makes sure the object cannot be modified, even its nested properties.
 * This function modifies obj!
 * @param {object} obj object to deeply freeze
 * @returns {object} obj (deeply frozen)
 */
function deepFreeze(obj) {
    const propNames = Object.getOwnPropertyNames(obj);
    propNames.forEach(function(name) {
        const prop = obj[name];
        if (typeof prop === 'object' && prop !== null) deepFreeze(prop);
    });
    return Object.freeze(obj);
}

/**
 * Uses JSON.parse and JSON.stringify for plain object deep cloning
 * @param {object} obj object to deeply clone
 * @returns {object} deep clone of obj
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Similar to lodash.merge(), but
 * - does not modify source object (resturns its deep clone instead)
 * - makes that nested objects in patchObj are actually modified
 * - removes all keys from srcObj that have value set to undefined in patchObj
 * @param {*} srcObj source object to be updated
 * @param {*} patchObj object containing all changes (can be deeply nested)
 * @returns {object} deep clone of srcObj updated with patchObj
 */
function tracedUpdate(srcObj, patchObj = {}) {
    const dstObj = Object.assign({}, srcObj);

    // Consider only the keys included in patchObj.
    for (let k in patchObj) {
        const changeVal = patchObj[k];

        // Delete keys explicitly set to undefined / void 0.
        // This is more efficient than looping through the whole srcObj
        // and copying only the keys included in patchObj.
        if (changeVal === void 0) {
            delete dstObj[k];
            continue;
        }

        const currentVal = dstObj[k];
        const shouldUpdate = canBeNested(currentVal) && canBeNested(changeVal);
        dstObj[k] = shouldUpdate ? tracedUpdate(currentVal, changeVal) : changeVal;
    }

    return dstObj;
}

// Only non-null and non-array objects can contain child objects.
function canBeNested(obj) {
    return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}
