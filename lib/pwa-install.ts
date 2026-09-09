export type InstallPrompt=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed"}>};
let pendingPrompt:InstallPrompt|null=null;
export const getInstallPrompt=()=>pendingPrompt;
export const rememberInstallPrompt=(prompt:InstallPrompt|null)=>{pendingPrompt=prompt;};
