'use strict';

let rs = require('jsrsasign');
let rsu = require('jsrsasign-util');
//let path = require('path');

// CONSTANTS
//const RSA_KEYSIZE = 2048;
//const ALGORITHM = 'RSA';
const HASHALGORITHM = 'SHA256withRSA';

// Sign a file/data with a Private/Public key
const signDataOrFile = (
    dataOrFile,
    privateKeyLocation,
    signatureOutputLocation
) => {
    let prvPEM = rsu.readFile(privateKeyLocation);
    let prv = rs.KEYUTIL.getKey(prvPEM);
    let text;
    try {
        text = rsu.readFile(dataOrFile);
    } catch (ex) {
        text = dataOrFile;
    }
    let sig = new rs.KJUR.crypto.Signature({ alg: HASHALGORITHM });

    sig.init(prv);
    sig.updateString(text);
    let sigHex = sig.sign();
    rsu.saveFileBinByHex(signatureOutputLocation, sigHex);
    console.log('successfully signed');
};

// Verify the digital signature with
const verifySignature = (signatureFile, dataFile, publicKeyLocation) => {
    let pubPEM = rsu.readFile(publicKeyLocation);
    let pub = rs.KEYUTIL.getKey(pubPEM);
    let text;
    try {
        text = rsu.readFile(dataFile);
    } catch (ex) {
        text = dataFile;
    }

    let sigHex = rsu.readFileHexByBin(signatureFile);

    let sig = new rs.KJUR.crypto.Signature({ alg: HASHALGORITHM });
    sig.init(pub);
    sig.updateString(text);
    let isValid = sig.verify(sigHex);

    if (isValid) {
        console.log('signature is valid');
    } else {
        console.log('signature is invalid');
    }
    return isValid;
};

exports.verifySignature = verifySignature;
exports.signDataOrFile = signDataOrFile;

// generateKeypair("D:/work/github/Examples/outputs/", "test", 8);

// degreeData = {
//     StudentNameAtTimeofDegree: "Abc Def",
//     StudentDateOfBirth: "1990-01-01",
//     StudentPlaceOfBirth: "London",
//     University: "University of London",
//     PlaceOfStudy: "London,GB",
//     NameOfDegree: "Bachelor of ComputerScience",
//     DegreeAwardedOnDate: "2016-07-28",
//     CGPA: "7.8",
//     AttendanceDates: "2012 to 2016",
// };

// signDataOrFile(
//   JSON.stringify(degreeData),
//   "D:/work/github/Examples/outputs/test.prv.pem",
//   "D:/work/github/Examples/outputs/signature.txt"
// );

//   verifySignature(
//     "D:/work/github/Examples/outputs/signature.txt",
//     JSON.stringify(degreeData),
//     "D:/work/github/Examples/outputs/test.pub.pem"
//   );
