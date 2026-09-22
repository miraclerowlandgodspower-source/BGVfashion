import { NextResponse } from "next/server";
import { checkAdminApiAccess } from "@/lib/auth";
import { checkIntegration, getIntegrationStatuses, sendTestEmail, testCloudinaryUpload } from "@/lib/integrations";

export async function GET() {
  const access = await checkAdminApiAccess();
  if (!access.authorized) return access.errorResponse!;

  try {
    return NextResponse.json({ success: true, data: { integrations: await getIntegrationStatuses() } });
  } catch (error) {
    console.error("Failed to check integrations:", error);
    return NextResponse.json({ success: false, error: "Unable to check integrations." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const access = await checkAdminApiAccess();
  if (!access.authorized) return access.errorResponse!;

  try {
    const { action, integration } = await request.json();
    if (action === "send_test_email") return NextResponse.json({ success: true, data: await sendTestEmail() });
    if (action === "test_cloudinary_upload") return NextResponse.json({ success: true, data: await testCloudinaryUpload() });
    if (action === "test_connection" && typeof integration === "string") {
      return NextResponse.json({ success: true, data: await checkIntegration(integration) });
    }
    return NextResponse.json({ success: false, error: "Unknown integration action." }, { status: 400 });
  } catch (error) {
    console.error("Integration action failed:", error);
    return NextResponse.json({ success: false, error: "Unable to run integration test." }, { status: 500 });
  }
}