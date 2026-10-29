import { pageForGuide, metadataForGuide, paramsForGuides, type GuideParams } from '../../../../../components/wealthos-guides';
export const dynamicParams = false;
export function generateStaticParams() { return paramsForGuides('fr'); }
export function generateMetadata(props: GuideParams) { return metadataForGuide('fr', props); }
export default function GuidePage(props: GuideParams) { return pageForGuide('fr', props); }
