import PublicAnalytics from '../../components/public-analytics';
import { metadata as baseMetadata } from '../(pt)/layout';
export const metadata = baseMetadata;
export default function Layout({children}:{children:React.ReactNode}) {return <html lang="fr"><body style={{margin:0}}>{children}<PublicAnalytics/></body></html>;}
