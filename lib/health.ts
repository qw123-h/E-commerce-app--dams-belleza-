import {prisma} from "@/lib/prisma";

type CheckState = "ok" | "fail" | "warn";

type HealthPayload = {
  service: string;
  status: "ok" | "degraded";
  environment: {
    nodeEnv: string;
    appVersion: string;
    uptimeSeconds: number;
  };
  checks: {
    app: CheckState;
    database: CheckState;
    requiredEnv: CheckState;
    optionalEnv: CheckState;
  };
  details: {
    requiredEnvMissing: string[];
    optionalEnvMissing: string[];
  };
  timestamp: string;
};

const REQUIRED_ENV_VARS = ["DATABASE_URL", "NEXTAUTH_URL", "NEXTAUTH_SECRET"];
const OPTIONAL_ENV_VARS = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "WHATSAPP_NUMBER", "STORE_NAME"];

function hasCloudinaryConfig() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function getMissingEnv(keys: string[]) {
  return keys.filter((key) => {
    const value = process.env[key];
    return !value || !value.trim();
  });
}

export async function runHealthChecks() {
  const requiredEnvMissing = getMissingEnv(REQUIRED_ENV_VARS);
  const optionalEnvMissing = getMissingEnv(OPTIONAL_ENV_VARS);

  let databaseCheck: CheckState = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    databaseCheck = "fail";
  }

  const checks: HealthPayload["checks"] = {
    app: "ok",
    database: databaseCheck,
    requiredEnv: requiredEnvMissing.length === 0 ? "ok" : "fail",
    optionalEnv: optionalEnvMissing.length === 0 ? "ok" : "warn",
  };

  const payload: HealthPayload = {
    service: "dams-belleza",
    status: checks.database === "ok" && checks.requiredEnv === "ok" ? "ok" : "degraded",
    environment: {
      nodeEnv: process.env.NODE_ENV ?? "unknown",
      appVersion: process.env.npm_package_version ?? "unknown",
      uptimeSeconds: Math.floor(process.uptime()),
    },
    checks,
    details: {
      requiredEnvMissing,
      optionalEnvMissing,
    },
    timestamp: new Date().toISOString(),
  };

  return {
    payload,
    httpStatus: payload.status === "ok" ? 200 : 503,
  };
}

export async function runBusinessFlowChecks() {
  const [publishedProducts, inStockPublishedProducts, activeDeliveryZones] = await Promise.all([
    prisma.product.count({
      where: {
        isPublished: true,
        deletedAt: null,
        salePrice: {
          not: null,
        },
      },
    }),
    prisma.product.count({
      where: {
        isPublished: true,
        deletedAt: null,
        salePrice: {
          not: null,
        },
        stock: {
          is: {
            quantityOnHand: {
              gt: 0,
            },
          },
        },
      },
    }),
    prisma.deliveryZone.count({
      where: {
        isActive: true,
        deletedAt: null,
      },
    }),
  ]);

  const checkoutCatalogOk = publishedProducts > 0;
  const checkoutStockOk = inStockPublishedProducts > 0;
  const deliveryCoverageOk = activeDeliveryZones > 0;

  const cloudinaryReady = hasCloudinaryConfig();
  const uploadOk = process.env.NODE_ENV === "production" ? cloudinaryReady : true;

  const status = checkoutCatalogOk && checkoutStockOk && deliveryCoverageOk && uploadOk ? "ok" : "degraded";

  return {
    payload: {
      service: "dams-belleza",
      status,
      flow: "checkout-to-delivery",
      timestamp: new Date().toISOString(),
      checks: {
        checkoutCatalog: checkoutCatalogOk ? "ok" : "fail",
        checkoutStock: checkoutStockOk ? "ok" : "fail",
        deliveryCoverage: deliveryCoverageOk ? "ok" : "fail",
        imageUploadProvider: uploadOk ? "ok" : "fail",
      },
      metrics: {
        publishedProducts,
        inStockPublishedProducts,
        activeDeliveryZones,
      },
      details: {
        imageUploadProvider: cloudinaryReady ? "cloudinary" : "local",
        cloudinaryConfigured: cloudinaryReady,
        nodeEnv: process.env.NODE_ENV ?? "unknown",
      },
    },
    httpStatus: status === "ok" ? 200 : 503,
  } as const;
}
