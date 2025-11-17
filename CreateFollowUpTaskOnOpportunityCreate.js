using Microsoft.Xrm.Sdk;
using System;

namespace Plugins.OpportunityPlugins
{
    public class CreateFollowUpTaskOnOpportunityCreate : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {
            // Obtain context
            var context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            var serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            var service = serviceFactory.CreateOrganizationService(context.UserId);
            var tracing = (ITracingService)serviceProvider.GetService(typeof(ITracingService));

            try
            {
                // Ensure this is a Create of Opportunity
                if (context.PrimaryEntityName != "opportunity" || context.MessageName != "Create")
                    return;

                // Target entity
                if (!context.InputParameters.Contains("Target") || !(context.InputParameters["Target"] is Entity))
                    return;

                Entity opportunity = (Entity)context.InputParameters["Target"];

                // Get required fields
                Guid opportunityId = context.PrimaryEntityId;
                EntityReference ownerRef = opportunity.Contains("ownerid") 
                                            ? opportunity.GetAttributeValue<EntityReference>("ownerid")
                                            : null;

                // Prepare Task entity
                Entity task = new Entity("task");

                task["subject"] = "Follow up with customer";
                task["scheduledend"] = DateTime.UtcNow.AddDays(2);
                task["ownerid"] = ownerRef;
                task["regardingobjectid"] = new EntityReference("opportunity", opportunityId);

                // Create Task record
                service.Create(task);
            }
            catch (Exception ex)
            {
                tracing.Trace("Error: " + ex.Message);
                throw;
            }
        }
    }
}
