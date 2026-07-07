I would like to make a property booking app, similar to airbnb, with placeholder title "Soweto Stays". I want to use a MERN tech stack, please set up the architechure to be enterprise level. Front end can be Type Script. 


We will build it in slices. 

Users need to create accounts and be logged in order to book. YOu can search properties but can book without signin.

There are 3 types of users:

Guest - users that are looking book a stay
host -  users that list their properties for booking 
Admins -  site runners that handle accounts, issues, refunds, payment routing

Sign in via google Oaut2/ passport.js.


properties: should have at most 8 pictures, location, stay_rate, stay duration, bolean (available/not available), please add relevsant information i didnt think off. 

Booking: model that handles books, to have guest id, landload id, property id, contractual time, payment details (? not sure if this should live  here)

please integrate paysharp as a payment system.

please investigsate if any of these can be a microservice for ease/simplicity

Admins recieve funds from guests whenbookig is confirmed, take an admin fee, send rest to hosts. 


Experience:

There should be different pages for access per user type. 

host and Admins can make listings (might need listing model maybe unnecessary)
Adminds need a way of sendig cash to landload, mayve also via paysharp



Notifications:
Users should get email notifications for each stage of the booking, and reminder of booking 24hrs beforehand. 


Guests can rate properties and hosts. Hosts can rate guests two. preferably 24hrs after stay. 

Please create a plan for making this and interview me on questions, save plan document in SOWETOHOME, as claude_plan.md





