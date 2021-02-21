/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');
const CryptoFunctions = require('./CryptoFunctions');

// ===== DATA =======
// universityPublicKeys_<uniName>
// RequestStudentToUni_<studentName>_<uniName>
// RequestVerifierToStudent_<studentName>
// PastVerifications_<studentName>
// universityDegree_<uniName>_<degreeNum> - definition of 1 degree + digital signature
// employmentCertificate_<employerName>_<employeeNum> - definition of 1 employment + digital signature
// verification_<verifierName>_<userName> - reference to docs that were verified
// records_userName - reference to the degreeName that he holds.Ideally files like passport etc that hold
// identity for the student as well

//To Do - link to student's verified driving license/passport file encrypted

// ==== CHAINCODE FUNCTIONS =====
// Instantiate
// AddAUniversityPublicKey
// AddAUserPublicKey -- Left for now - note that Hyperledger allows identities already for connection gateway via public/private keys
// VerifierRequestDegreeFromStudent(studentUserName)
// UserRequestDegreeFromUni(studentUserName,uniName,StudentNameAtTimeofDegree, StudentDateOfBirth)

// GetOpenStudentRequests(UniversityName)
// GetCountOfDegreesIssued(UniName)
// UnivIssueDegree(studentUserName, degreeData, Signature);
// VerifyUniversityDegree(DegreeID)
// GetAllOpenVerifierRequests(studentUserName)
// GetAStudentDegrees(studentUserName)
// GetAllIssuedDegrees(UniversityName)

class CredsVerifyContract extends Contract {
    async instantiate(ctx) {
        console.info('instantiate');
    }

    async addToUserRecords(ctx, userName,credentialTypeName,credential_id) {
        let record_id = 'records_' + userName;
        const buffer = await ctx.stub.getState(record_id);

        // empty record, then add the first credential
        if (!buffer || buffer.toString().length === 0) {
            console.info(
                `User record empty : ${record_id} . Will instantiate`
            );
            let userRecord = { [credentialTypeName]: [credential_id] };
            const buffer1 = Buffer.from(JSON.stringify(userRecord));
            await ctx.stub.putState(record_id, buffer1);
            console.info('added id : ', record_id);
            return;
        }
        // user already exists, add to their existing data
        let userRecord = JSON.parse(buffer.toString());
        let existingCreds = credentialTypeName in userRecord ? userRecord[credentialTypeName] : [];
        let newCreds = [...existingCreds,credential_id];
        userRecord[credentialTypeName] = newCreds;
        const buffer1 = Buffer.from(JSON.stringify(userRecord));
        await ctx.stub.putState(record_id, buffer1);
        console.info('added id : ', record_id);
    }

    async AddAUniversityPublicKey(ctx, universityName, publicKey) {
        let id = 'universityPublicKeys_' + universityName;
        // Does this key already exist? - a check for future
        // Only allow this guy to add a new key if they can verify who they are?
        // ctx.clientIdentity() ??? -- see in debugmode what this provides
        const pk = { PublicKey: publicKey };
        const buffer = Buffer.from(JSON.stringify(pk));
        await ctx.stub.putState(id, buffer);
        console.info('added id : ', id);
    }

    async GetAUniversityPublicKey(ctx, universityName) {
        let id = 'universityPublicKeys_' + universityName;
        const buffer = await ctx.stub.getState(id);
        if (!buffer) {
            throw new Error(`Public Key for  ${id} does not exist`);
        }
        return JSON.parse(buffer.toString());
    }

    async GetRequests(ctx, keyBeginPhrase,userName,userType){
        let allRequests = [];

        const iterator = userType === 'REQUESTOR'
            ? await ctx.stub.getStateByRange(keyBeginPhrase ,userName)
            : await ctx.stub.getStateByRange(keyBeginPhrase + userName,'');

        //const iterator = await ctx.stub.getStateByRange(keyBeginPhrase ,userName);
        let result = await iterator.next();
        let count = 0;
        if (result.value && result.value.value.toString()) {
            const keyCorrect1 = (userType === 'REQUESTOR') ? result.value.key.endsWith(userName) : !result.value.key.endsWith(userName);
            if(result.value.key.startsWith(keyBeginPhrase) && keyCorrect1){
                let request = JSON.parse( result.value.value.toString('utf8'));
                request.key1 = result.value.key;
                allRequests = request ? [request, ...allRequests] : allRequests;
                count = count + 1;
            }
        }
        while (!result.done && result.value && result.value.value.toString()) {
            result = await iterator.next();
            const keyCorrect2 = userType === 'REQUESTOR' ? result.value.key.endsWith(userName) : !result.value.key.endsWith(userName);
            if(result.value.key.startsWith(keyBeginPhrase) && keyCorrect2){
                let request = JSON.parse( result.value.value.toString('utf8'));
                request.key1 = result.value.key;
                allRequests = request ? [request, ...allRequests] : allRequests;
                count = count + 1;
            }
        }
        console.log('returning all results : ', allRequests);
        return allRequests;
    }

    async VerifierRequestDegreeFromStudent(
        ctx,
        studentUserName,
        verifierUserName,
        credentialDescription
    ) {
        // Need to first read the version number of this request if any.
        // test cases - not all verifier requests to end up in the same id.
        // i.e. the verifierUserName needs to be in the id
        let id = 'RequestVerifierToStudent_' + studentUserName + '_' + verifierUserName;
        const rvts = {
            VerifierName: verifierUserName,
            credentialDescription: credentialDescription,
            requestDate: new Date(),
            requestStatus: 'PENDING',
        };
        const buffer = Buffer.from(JSON.stringify(rvts));
        await ctx.stub.putState(id, buffer);
        console.info('added id : ', id);
    }

    async EditARequest(
        ctx,
        request_id,
        objectJsonString
    ) {
        let existingData = await this.GetAIDData(ctx,request_id);
        // convert string to JSON object
        let newData = JSON.parse(objectJsonString);

        for(const aKey in newData){
            existingData[aKey] = newData[aKey];
        }

        const buffer = Buffer.from(JSON.stringify(existingData));
        await ctx.stub.putState(request_id, buffer);
        console.info('added id : ', request_id);
    }

    async GetAIDData(ctx,id){
        const buffer = await ctx.stub.getState(id);
        if (!buffer) {
            throw new Error(`Cannot find data  ${id} does not exist`);
        }
        return JSON.parse(buffer.toString());
    }

    async GetVerifierRequests(ctx, userName, userType) {

        const allVerifyerRequests = await this.GetRequests(ctx,
            'RequestVerifierToStudent_',
            userName,
            userType);

        return allVerifyerRequests;
    }

    async UserRequestDegreeFromUni(
        ctx,
        uniName,
        studentUserName,
        StudentNameAtTimeofDegree,
        StudentDateOfBirth
    ) {
        let id = 'RequestStudentToUni_' + uniName + '_' +  studentUserName;
        const rstu = {
            UniversityName: uniName,
            StudentUserName: studentUserName,
            StudentNameAtTimeofDegree: StudentNameAtTimeofDegree,
            StudentDOB: StudentDateOfBirth,
            requestDate: new Date(),
            requestStatus: 'PENDING',
        };
        const buffer = Buffer.from(JSON.stringify(rstu));
        await ctx.stub.putState(id, buffer);
        console.info('added id : ', id);
    }

    async GetRequestsToUni(ctx, userName, userType) {

        const allUniRequests = await this.GetRequests(ctx,
            'RequestStudentToUni_',
            userName,
            userType);

        return allUniRequests;
    }

    async GetNumberOfDegreesIssued(ctx, uniName) {
        const iterator = await ctx.stub.getStateByRange(
            'universityDegree_' + uniName + '_1',
            'universityDegree_' + uniName + '_10000000000'
        );
        let result = await iterator.next();
        let count = 0;
        if (result.value && result.value.value.toString()) {
            count = count + 1;
        }
        while (!result.done) {
            //const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            count = count + 1;
            result = await iterator.next();
        }
        console.log(`number of degrees : ${count}`);
        return count;
    }

    async UniversityIssueDegree(
        ctx,
        uniName,
        studentUserName,
        degreeData,
        signature,
        studentRequestID
    ) {
        // The degreeData is a JSON string and we may need to parse it again later when displaying
        //  JSON.parse( degreeData.replace(/'/g, '"'))
        let degreeDataWithSignature = {
            DegreeData: degreeData,
            Signature: signature,
        };
        let buffer = Buffer.from(JSON.stringify(degreeDataWithSignature));

        let numDegrees = await this.GetNumberOfDegreesIssued(ctx, uniName);
        let degree_id = 'universityDegree_' + uniName + '_' + (numDegrees + 1);
        await ctx.stub.putState(degree_id, buffer);
        console.info('added id : ', degree_id);

        // Add to student user's records this newly issued degree
        await this.addToUserRecords(ctx, studentUserName,'Degrees',degree_id);

        //Update student's request to confirm that a degree has been issued for them
        let rstu = await this.GetAIDData(ctx,studentRequestID);
        rstu.requestStatus = 'COMPLETED';
        rstu.degree_id = degree_id;
        buffer = Buffer.from(JSON.stringify(rstu));
        await ctx.stub.putState(studentRequestID, buffer);
        console.info('updated students request : ', studentRequestID);
    }

    async OwnerUpdateVerifyerRequest(ctx,verifyerRequestID,degreeID){
        let rvts = this.GetAIDData(ctx,verifyerRequestID);
        rvts.requestStatus = 'COMPLETED';
        rvts.degree_id = degreeID;
        rvts.serviceTime = new Date();
        const buffer = Buffer.from(JSON.stringify(rvts));
        await ctx.stub.putState(verifyerRequestID, buffer);
        console.info('updated verifyers request : ', verifyerRequestID);
    }

    async getDegree(ctx, degreeID) {
        const buffer = await ctx.stub.getState(degreeID);
        if (!buffer) {
            throw new Error(`The degree ${degreeID} does not exist`);
        }
        const degree = JSON.parse(buffer.toString());
        return degree;
    }

    async VerifyUniversityDegree(ctx, degreeID) {
        // Get this degree from the ledger
        let degree = this.getDegree(ctx, degreeID);
        // get the uniName from the degree
        let uniName = degreeID.split('_')[1];
        // pull out the data and the signature from the object
        let signature = degree.Signature;
        let degreeData = degree.DegreeData;
        // get the public key of the uni from ledger
        let pk = this.GetAUniversityPublicKey(uniName);
        let publicKey = pk.PublicKey;

        // Verify the signature
        let isValid = CryptoFunctions.verifySignature(
            signature,
            degreeData,
            publicKey
        );
        return isValid;
    }
}

module.exports = CredsVerifyContract;
