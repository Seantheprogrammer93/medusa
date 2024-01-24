import { DB_URL } from "@medusajs/pricing/integration-tests/utils"
import { IAuthenticationModuleService } from "@medusajs/types"
import { MedusaModule } from "@medusajs/modules-sdk"
import { MikroOrmWrapper } from "../../../utils"
import { SqlEntityManager } from "@mikro-orm/postgresql"
import { createAuthProviders } from "../../../__fixtures__/auth-provider"
import { initialize } from "../../../../src"

jest.setTimeout(30000)

describe("AuthenticationModuleService - AuthProvider", () => {
  let service: IAuthenticationModuleService
  let testManager: SqlEntityManager

  beforeEach(async () => {
    await MikroOrmWrapper.setupDatabase()
    testManager = MikroOrmWrapper.forkManager()

    service = await initialize({
      database: {
        clientUrl: DB_URL,
        schema: process.env.MEDUSA_PRICING_DB_SCHEMA,
      },
    })

    if (service.__hooks?.onApplicationStart) {
      await service.__hooks.onApplicationStart()
    }
  })

  afterEach(async () => {
    await MikroOrmWrapper.clearDatabase()
    MedusaModule.clearInstances()
  })

  describe("listAuthProviders", () => {
    it("should list default AuthProviders registered by loaders", async () => {
      const authProviders = await service.listAuthProviders()
      const serialized = JSON.parse(JSON.stringify(authProviders))

      expect(serialized).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            provider: "usernamePassword",
            name: "Username/Password Authentication",
          }),
          expect.objectContaining({
            provider: "google",
            name: "Google Authentication",
          }),
        ])
      )
    })
  })

  describe("authenticate", () => {
    it("authenticate validates that a provider is registered in container", async () => {
      await createAuthProviders(testManager, [
        {
          provider: "notRegistered",
          name: "test",
        },
      ])

      const { success, error } = await service.authenticate("notRegistered", {})

      expect(success).toBe(false)
      expect(error).toEqual(
        "AuthenticationProvider with for provider: notRegistered wasn't registered in the module. Have you configured your options correctly?"
      )
    })
  })
})