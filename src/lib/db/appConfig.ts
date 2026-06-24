import { createAdminClient } from "@/lib/supabase/admin";
import { APP_VERSION } from "@/lib/app/version";

const CONFIG_ROW_ID = "default";

export async function getMinRequiredVersion(): Promise<string> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("app_config")
      .select("min_required_version")
      .eq("id", CONFIG_ROW_ID)
      .maybeSingle();

    if (error || !data?.min_required_version) {
      return APP_VERSION;
    }

    return data.min_required_version as string;
  } catch {
    return APP_VERSION;
  }
}
