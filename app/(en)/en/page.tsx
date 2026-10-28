import InternationalLanding from '../../../components/international-landing';
import { internationalMetadata } from '../../../lib/seo';
export const metadata = internationalMetadata('en');
export default function EnglishOverview() { return <InternationalLanding locale="en" />; }
