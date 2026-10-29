import { pageForGuide, metadataForGuide, paramsForGuides, type GuideParams } from '../../../../../components/wealthos-guides';
export const dynamicParams = false;
export function generateStaticParams() { return paramsForGuides('es'); }
export function generateMetadata(props: GuideParams) { return metadataForGuide('es', props); }
export default function GuidePage(props: GuideParams) { return pageForGuide('es', props); }
