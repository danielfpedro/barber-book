import prisma from '@/lib/prisma';

export default async function ServicesPage({ params }) {
  const tenantSlug = params.tenant;

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
  });

  if (!tenant) {
    return <div>Tenant not found</div>;
  }

  const services = await prisma.service.findMany({
    where: { tenantId: tenant.id },
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Our Services at {tenant.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <div key={service.id} className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">{service.name}</h2>
              <p>{service.description}</p>
              <p className="text-lg font-semibold">${service.price.toFixed(2)}</p>
              <p className="text-sm">Duration: {service.duration} minutes</p>
              <div className="card-actions justify-end">
                <button className="btn btn-primary">Book Now</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
