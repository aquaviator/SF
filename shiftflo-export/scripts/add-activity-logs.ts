import { db } from '../server/db';
import { activityLogs } from '../shared/schema';

async function addActivityLogs() {
  console.log("📝 Adding recent activity logs...");
  
  const currentTime = new Date();
  const oneHourAgo = new Date(currentTime.getTime() - 60 * 60 * 1000);
  const twoHoursAgo = new Date(currentTime.getTime() - 2 * 60 * 60 * 1000);
  const threeHoursAgo = new Date(currentTime.getTime() - 3 * 60 * 60 * 1000);
  
  await db.insert(activityLogs).values([
    {
      tenantId: "acme-corp",
      userId: 1,
      action: "created",
      resourceType: "shift",
      resourceId: "41",
      details: "Created July 4th morning shift for Head Chef",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0",
      createdAt: threeHoursAgo,
    },
    {
      tenantId: "acme-corp", 
      userId: 3,
      action: "assigned",
      resourceType: "shift",
      resourceId: "43",
      details: "Assigned Server shift for July 4th lunch service",
      ipAddress: "192.168.1.102",
      userAgent: "Mozilla/5.0",
      createdAt: twoHoursAgo,
    },
    {
      tenantId: "acme-corp",
      userId: 1,
      action: "approved",
      resourceType: "holiday_request", 
      resourceId: "1",
      details: "Approved vacation request for Mike Johnson",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0",
      createdAt: oneHourAgo,
    },
    {
      tenantId: "acme-corp",
      userId: 4,
      action: "clocked_in",
      resourceType: "time_entry",
      resourceId: "1",
      details: "Started bartender shift at 5:00 PM",
      ipAddress: "192.168.1.104",
      userAgent: "Mozilla/5.0",
      createdAt: currentTime,
    },
  ]);
  
  console.log("✅ Activity logs added successfully!");
  process.exit(0);
}

addActivityLogs().catch(console.error);