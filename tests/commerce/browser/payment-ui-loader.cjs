module.exports = function transform(source) {
    const done = this.async();
    const swc = require('next/dist/build/swc');
    swc.loadBindings().then(() => swc.transform(source, {
        filename: this.resourcePath,
        jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } }, target: 'es2020' },
        module: { type: 'es6' },
    })).then((result) => done(null, result.code), done);
};
