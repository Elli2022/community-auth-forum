import { getSql } from "../../db/client";
import makeRecoveryRepository from "../../db/recovery-repository";

const recoveryRepository = makeRecoveryRepository({ sql: getSql() });

export { recoveryRepository };
