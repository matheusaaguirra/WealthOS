import InternationalLanding from '../../../components/international-landing';
import { internationalMetadata } from '../../../lib/seo';
export const metadata = internationalMetadata('es');
export default function SpanishOverview() { return <InternationalLanding locale="es" />; }
