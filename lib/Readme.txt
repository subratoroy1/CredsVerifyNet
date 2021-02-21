instantiateUserRecord(student1) 
AddAUniversityPublicKey()
UniversityIssueDegree()

'VerifierRequestDegreeFromStudent' : "student@gmail.com","verifyer@gmail.com","Bachelor Degrees"
'VerifierRequestDegreeFromStudent' : "student@gmail.com","verifyer1@gmail.com","Masters Degrees"

GetAIDData : "RequestVerifierToStudent_student@gmail.com_verifyer@gmail.com"
GetAIDData : "RequestVerifierToStudent_student@gmail.com_verifyer1@gmail.com"
GetAIDData : "records_student@gmail.com"
GetAIDData : "RequestStudentToUni_student@gmail.com_degreeAdmin@university.com"
GetAIDData : "universityDegree_degreeAdmin@university.com_1"

EditARequest : "RequestVerifierToStudent_student@gmail.com_verifyer@gmail.com" , "{ 'name':'John', 'age':'30', 'city':'New York'}"

GetVerifierRequests : "student@gmail.com" , "SERVICER"
GetVerifierRequests : "verifyer@gmail.com" , "REQUESTOR"
GetVerifierRequests : "student@gmail.com" , "REQUESTOR"

UserRequestDegreeFromUni : "degreeadmin@university.com", "student@gmail.com", "John Smith", "01-01-1998"
"RequestStudentToUni_degreeAdmin@university.com_student@gmail.com"

GetRequestsToUni : "degreeadmin@university.com", "SERVICER"
GetRequestsToUni : "student@gmail.com", "REQUESTOR"

GetNumberOfDegreesIssued : "degreeadmin@university.com"

UniversityIssueDegree : "degreeadmin@university.com" , "student@gmail.com" , "{'userName':'student@gmail.com','a':'b'}", "aSignatureTextHere", "RequestStudentToUni_degreeAdmin@university.com_student@gmail.com"
        

        '{"userName":"student@gmail.com","fullName":"John Smith","dateOfBirth":"01-01-1998","placeOfBith":"London","nameOfDegree":"Bachelor of Science in Mathematics","placeOfAttendance":"London","attendedFrom":"01-01-2015","attendedTill":"01-01-2019","degreeIssueDate":"01-01-2019","marksObtained":"80"}',
        JSON.stringify({userName: "student@gmail.com",
                        fullName: "John Smith",
                        dateOfBirth: "01-01-1998",
                        placeOfBith: "London",
                        nameOfDegree: "Bachelor of Science in Mathematics",
                        placeOfAttendance: "London",
                        attendedFrom: "01-01-2015",
                        attendedTill: "01-01-2019",
                        degreeIssueDate: "01-01-2019",
                        marksObtained: "80"})
        
# kinds of records we need to query : 
        "universityDegree_degreeAdmin@university.com_1" => this needs a new range function? 
                        GetRequests("universityDegree_","degreeadmin@university.com","NONE")
        'records_' + userName; => this can be sent to GetAIDData()

======================================================================================
======================================================================================
======================================================================================
======================================================================================

a generic dropdown to traverse through the contents of user records : already got from BC
a view to see the degree contents from above selected dropdown : AIDData


for SERVICER to Verifier, the ability to add contents to the request_id by choosing from records

a new BC function to add an object to the request_id

for verifier to be able to view public key
for verifier to be able to see a degree data by using the record ID shared
for verifier to verify the degree data by comining the public key + signature

The requests page needs to be a choice of request and multiple-choice of responses. 
        On left side should be a dropdown to choose the request to reply to.
        On right side cards of chosen multiple choise radio cards with the degree details.