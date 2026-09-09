import {PageHeader} from "@/components/page-header";
import {PageContainer} from "@/components/page-container";
import {InstallApp} from "@/components/pwa/install-app";
export default function InstallPage(){return <div><PageHeader title="Rotary on your home screen." description="A familiar place for your club, wherever the day takes you." /><PageContainer className="max-w-4xl"><InstallApp /></PageContainer></div>;}
