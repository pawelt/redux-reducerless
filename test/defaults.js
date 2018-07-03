module.exports = {
    // default store state used in all tests
    section1Defaults: {
        a1: 'xxx',
        a2: {
            a21: 123,
            a22: {
                a221: 123,
                a222: 456,
                a223: 789,
            },
        },
        a3: {
            a31: [1, 2, 3],
            a32: 'yyy',
        },
    },
};

it('jest compat', () => {});
