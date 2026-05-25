const FREE_PLAN = {
  _id: 'free',
  name: 'Free',
  slug: 'free',
  durationMonths: 0,
  price: 0,
  originalPrice: 0,
  discount: 0,
  features: ['Free mock tests', 'Basic performance report', 'Limited study access'],
  isPopular: false,
  isActive: true,
  order: 0,
};

const STARTER_PLAN = {
  _id: 'starter',
  name: 'Starter',
  slug: 'starter',
  durationMonths: 1,
  price: 99,
  originalPrice: 199,
  discount: 50,
  features: ['Premium test series access', 'Detailed result analysis', 'Bookmark and revision tools'],
  isPopular: true,
  isActive: true,
  order: 1,
};

const toPlainPlan = (plan: any) => (typeof plan?.toObject === 'function' ? plan.toObject() : plan);

export const normalizeSubscriptionPlans = (plans: any[] = []) => {
  const plainPlans = plans.map(toPlainPlan);
  const hasFreePlan = plainPlans.some(plan => plan.slug === 'free' || plan.price === 0);
  const hasStarterPlan = plainPlans.some(plan => plan.slug === 'starter' || plan.price === 99);

  return [
    ...(hasFreePlan ? [] : [FREE_PLAN]),
    ...(hasStarterPlan ? [] : [STARTER_PLAN]),
    ...plainPlans,
  ].sort((a, b) => {
    if (a.slug === 'free') return -1;
    if (b.slug === 'free') return 1;
    if (a.price === 99) return -1;
    if (b.price === 99) return 1;
    return (a.order || 0) - (b.order || 0);
  });
};

export const defaultSubscriptionPlans = normalizeSubscriptionPlans([
  {
    _id: 'pro',
    name: 'Pro',
    slug: 'pro',
    durationMonths: 1,
    price: 249,
    originalPrice: 299,
    discount: 17,
    features: ['Premium test series access', 'Detailed result analysis', 'Bookmark and revision tools'],
    isPopular: false,
    isActive: true,
    order: 2,
  },
  {
    _id: 'premium',
    name: 'Premium',
    slug: 'premium',
    durationMonths: 1,
    price: 499,
    originalPrice: 699,
    discount: 29,
    features: ['Everything in Pro', 'All premium mock tests', 'Priority support', 'Advanced performance insights'],
    isPopular: false,
    isActive: true,
    order: 3,
  },
]);
