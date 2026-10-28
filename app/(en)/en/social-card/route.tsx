import { internationalSocialImage } from '../../../../components/international-social-image';
const size = { width: 1200, height: 630 };
export function GET() { return internationalSocialImage('en'); }
export const dynamic = 'force-static';
