const { expect } = require('chai');
const { tracedUpdate, deepClone } = require('../dist');
const { section1Defaults } = require('./defaults');

describe('tracedUpdate', () => {
    it('updates values regardless of old and new value types', () => {
        const defaultsClone = deepClone(section1Defaults);

        const change = { a3: { a31: 666 } };
        const result = tracedUpdate(section1Defaults, change);

        expect(section1Defaults.a3.a31).is.an('array');
        expect(result.a3.a31).equal(666);
        expectDefaultsNotChanged(defaultsClone);
    });

    it('updates only fields present in the change object', () => {
        const defaultsClone = deepClone(section1Defaults);

        const change = {
            a2: {
                a22: {
                    a221: 666,
                    // a222 stays unchanged
                    a223: 777,
                },
            },
        };
        const result = tracedUpdate(section1Defaults, change);

        const expectedState = deepClone(section1Defaults);
        expectedState.a2.a22.a221 = 666;
        expectedState.a2.a22.a223 = 777;

        expect(result).eql(expectedState);

        // the fields not present in the change object were not touched
        expect(result.a2.a22.a222).equal(section1Defaults.a2.a22.a222);
        expectDefaultsNotChanged(defaultsClone);
    });

    it('makes sure the update is traced all the way to the root', () => {
        const defaultsClone = deepClone(section1Defaults);

        const change = {
            a2: {
                a22: {
                    a221: 666,
                },
            },
            a3: {
                a31: 'zzz',
            },
        };
        const result = tracedUpdate(section1Defaults, change);

        const expectedState = deepClone(section1Defaults);
        expectedState.a2.a22.a221 = 666;
        expectedState.a3.a31 = 'zzz';

        expect(result).eql(expectedState);

        // all fields on the path to the changed field are marked as modified
        // (their references have changed)
        expect(result.a2).not.equal(section1Defaults.a2);
        expect(result.a2.a22).not.equal(section1Defaults.a2.a22);
        expect(result.a3).not.equal(section1Defaults.a3);

        // neighbouring fields were not touched
        // (they have the same references as the original object)
        expect(result.a1).equal(section1Defaults.a1);
        expect(result.a2.a21).equal(section1Defaults.a2.a21);
        expect(result.a2.a23).equal(section1Defaults.a2.a23);
        expect(result.a3.a32).equal(section1Defaults.a3.a32);

        expectDefaultsNotChanged(defaultsClone);
    });
});

function expectDefaultsNotChanged(defaultsClone) {
    expect(defaultsClone).to.eql(section1Defaults);
}
