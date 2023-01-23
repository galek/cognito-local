import {buildClient, CommitmentPolicy, KmsKeyringNode,} from "@aws-crypto/client-node";
import {KMS} from "aws-sdk";
import {ContextInterface} from "../interfaces/services/context.interface";

export interface KMSConfigInterface {
    KMSKeyId?: string;
    KMSKeyAlias?: string;
}

const {encrypt} = buildClient(CommitmentPolicy.REQUIRE_ENCRYPT_ALLOW_DECRYPT);

export class CryptoService {
    config?: KMSConfigInterface & AWS.KMS.ClientConfiguration;

    constructor(config?: KMSConfigInterface) {
        this.config = config;
    }

    _keyringNode?: KmsKeyringNode;

    get keyringNode(): KmsKeyringNode {
        if (this._keyringNode) {
            return this._keyringNode;
        }

        if (!this.config || !this.config.KMSKeyAlias || !this.config.KMSKeyId) {
            throw new Error(
                "KMSConfig.KMSKeyAlias and KMSConfig.KMSKeyId is required when using a CustomEmailSender trigger."
            );
        }

        const {KMSKeyId, KMSKeyAlias, ...clientConfig} = this.config;

        const generatorKeyId = KMSKeyAlias;
        const keyIds = [KMSKeyId];

        return (this._keyringNode = new KmsKeyringNode({
            generatorKeyId,
            keyIds,
            clientProvider: () => new KMS(clientConfig),
        }));
    }

    async encrypt(ctx: ContextInterface, plaintext: string): Promise<string> {
        ctx.logger.debug({plaintext}, "encrypting code");

        const {result} = await encrypt(this.keyringNode, plaintext);

        const encryptedCode = result.toString("base64");

        ctx.logger.debug({encryptedCode}, "code succesfully encrypted");

        return encryptedCode;
    }
}
