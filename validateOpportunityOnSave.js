var isValidationBypassed = false;

function validateOpportunityOnSave(executionContext) {
    var formContext = executionContext.getFormContext();
    var eventArgs = executionContext.getEventArgs();

    if (isValidationBypassed) return;
    if (formContext.ui.getFormType() !== 1) return;

    var contact = formContext.getAttribute("parentcontactid").getValue();
    if (!contact) return;

    eventArgs.preventDefault();

    var contactId = contact[0].id.replace(/[{}]/g, "");
    var currentYear = new Date().getFullYear();

    Xrm.WebApi.retrieveMultipleRecords("opportunity",
        "?$select=createdon,statecode&$filter=_parentcontactid_value eq " + contactId + " and statecode eq 0"
    ).then(
        function success(result) {
            var hasActiveThisYear = result.entities.some(function (opp) {
                return new Date(opp.createdon).getFullYear() === currentYear;
            });

            if (hasActiveThisYear) {
                var confirmStrings = {
                    text: "This contact already has an active opportunity created this year. Do you still want to continue?",
                    title: "Duplicate Opportunity",
                    confirmButtonLabel: "Yes, Continue",
                    cancelButtonLabel: "No, Cancel"
                };
                var confirmOptions = { height: 200, width: 450 };

                Xrm.Navigation.openConfirmDialog(confirmStrings, confirmOptions).then(function (response) {
                    if (response.confirmed) {
                        isValidationBypassed = true;
                        formContext.data.save();
                    } else {
                        formContext.data.entity.attributes.forEach(function (attr) {
                            attr.setSubmitMode("never");
                            attr.setValue(attr.getValue());
                        });
                        formContext.ui.close();
                    }
                });
            } else {
                isValidationBypassed = true;
                formContext.data.save();
            }
        },
        function (error) {
            console.error("Error checking opportunities:", error.message);
            isValidationBypassed = true;
            formContext.data.save();
        }
    );
}
