import { pageForGuide, metadataForGuide, paramsForGuides, type GuideParams } from '../../../../components/wealthos-guides';
export const dynamicParams = false;
export function generateStaticParams() { return paramsForGuides('pt'); }
export function generateMetadata(props: GuideParams) { return metadataForGuide('pt', props); }
export default function GuidePage(props: GuideParams) { return pageForGuide('pt', props); }
