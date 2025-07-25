import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const tenants = await prisma.tenant.findMany();
    return new Response(JSON.stringify(tenants), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch tenants' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
