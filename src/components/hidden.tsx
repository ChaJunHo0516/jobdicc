/** 회사 Server Action 에 회사 slug 를 전달한다. 서버는 이 값과 세션으로 소속을 다시 검증한다. */
export function CompanyField({ slug }: { slug: string }) {
  return <input type="hidden" name="companySlug" value={slug} />;
}

export function Hidden({ name, value }: { name: string; value: string }) {
  return <input type="hidden" name={name} value={value} />;
}
