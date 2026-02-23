# QA Locations extension

The goal will be to create an extension that contains part of the functionality of the qa-script project inside the legacy directory
and a similar deployment strategy as the qr-ext project

The features go as follow

- The extension will have 2 fields a create button and a reset button
- field 1 will be name locations and the other one will be named priorities
- we will take fields similar to the format SS4:HV253.A, as shown in the qa-script project and will be sorted the same way as they are golang project
- we will add locations in the same way, they dont have to be sorted
- when hit create it will display on the extension a similar view as the one in the golang project for all the tables, this will not be downloadable, only displayed, from ther we can go back to re-enter new fields
- I also want the extension to hold a similar settings options to generate the location arrangement as the golang project
- It it should be able to deploy as the qr-ext project, on a zip file ready for distribution
- the table should have the highlighted fields as the priorities, similar to how the golang project does it
