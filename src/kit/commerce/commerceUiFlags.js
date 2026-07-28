export const COMMERCE_GATE8_FIXTURE_UI_ENABLED =
  typeof process !== 'undefined'
  && process.env.NEXT_PUBLIC_COMMERCE_GATE8_FIXTURE_UI === 'true';

export const COMMERCE_V2_UI_ENABLED =
  (
    typeof process !== 'undefined'
    && process.env.NEXT_PUBLIC_COMMERCE_V2_UI === 'true'
  )
  || COMMERCE_GATE8_FIXTURE_UI_ENABLED;
