import { pageForGuide, metadataForGuide, paramsForGuides, type GuideParams } from '../../../../../components/wealthos-guides';
export const dynamicParams = false;
export function generateStaticParams() { return paramsForGuides('it'); }
export function generateMetadata(props: GuideParams) { return metadataForGuide('it', props); }
export default function GuidePage(props: GuideParams) { return pageForGuide('it', props); }
