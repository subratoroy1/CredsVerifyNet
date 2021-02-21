/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { ChaincodeStub, ClientIdentity } = require('fabric-shim');
const { CredsVerifyContract } = require('..');
const winston = require('winston');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

class TestContext {

    constructor() {
        this.stub = sinon.createStubInstance(ChaincodeStub);
        this.clientIdentity = sinon.createStubInstance(ClientIdentity);
        this.logging = {
            getLogger: sinon.stub().returns(sinon.createStubInstance(winston.createLogger().constructor)),
            setLevel: sinon.stub(),
        };
    }

}

describe('CredsVerifyContract', () => {

    let contract;
    let ctx;

    beforeEach(() => {
        contract = new CredsVerifyContract();
        ctx = new TestContext();
        ctx.stub.getState.withArgs('1001').resolves(Buffer.from('{"value":"creds verify 1001 value"}'));
        ctx.stub.getState.withArgs('1002').resolves(Buffer.from('{"value":"creds verify 1002 value"}'));
    });

    describe('#credsVerifyExists', () => {

        it('should return true for a creds verify', async () => {
            await contract.credsVerifyExists(ctx, '1001').should.eventually.be.true;
        });

        it('should return false for a creds verify that does not exist', async () => {
            await contract.credsVerifyExists(ctx, '1003').should.eventually.be.false;
        });

    });

    describe('#createCredsVerify', () => {

        it('should create a creds verify', async () => {
            await contract.createCredsVerify(ctx, '1003', 'creds verify 1003 value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1003', Buffer.from('{"value":"creds verify 1003 value"}'));
        });

        it('should throw an error for a creds verify that already exists', async () => {
            await contract.createCredsVerify(ctx, '1001', 'myvalue').should.be.rejectedWith(/The creds verify 1001 already exists/);
        });

    });

    describe('#readCredsVerify', () => {

        it('should return a creds verify', async () => {
            await contract.readCredsVerify(ctx, '1001').should.eventually.deep.equal({ value: 'creds verify 1001 value' });
        });

        it('should throw an error for a creds verify that does not exist', async () => {
            await contract.readCredsVerify(ctx, '1003').should.be.rejectedWith(/The creds verify 1003 does not exist/);
        });

    });

    describe('#updateCredsVerify', () => {

        it('should update a creds verify', async () => {
            await contract.updateCredsVerify(ctx, '1001', 'creds verify 1001 new value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1001', Buffer.from('{"value":"creds verify 1001 new value"}'));
        });

        it('should throw an error for a creds verify that does not exist', async () => {
            await contract.updateCredsVerify(ctx, '1003', 'creds verify 1003 new value').should.be.rejectedWith(/The creds verify 1003 does not exist/);
        });

    });

    describe('#deleteCredsVerify', () => {

        it('should delete a creds verify', async () => {
            await contract.deleteCredsVerify(ctx, '1001');
            ctx.stub.deleteState.should.have.been.calledOnceWithExactly('1001');
        });

        it('should throw an error for a creds verify that does not exist', async () => {
            await contract.deleteCredsVerify(ctx, '1003').should.be.rejectedWith(/The creds verify 1003 does not exist/);
        });

    });

});