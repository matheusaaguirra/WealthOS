import { pageForGuide, metadataForGuide, paramsForGuides, type GuideParams } from '../../../../../components/wealthos-guides';
export const dynamicParams = false;
export function generateStaticParams() { return paramsForGuides('de'); }
export function generateMetadata(props: GuideParams) { return metadataForGuide('de', props); }
export default function GuidePage(props: GuideParams) { return pageForGuide('de', props); }
