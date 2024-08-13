import { v4 as uuid } from 'uuid';
import documentClient from '../utils/document.util';
import { BotInfo, WHConfig } from '../types/data.type';
import { Logger } from '../utils/logger.util';
import axios from 'axios';

export interface SessionItem {
    Id: string;
    APIUrl?: string;
    BearerToken?: string;
    MsgCount?: number;
}

export const createSession = async (): Promise<string> => {
    const sessionId = `s-${uuid()}`;

    await documentClient.put({
        TableName: process.env.SESSION_TABLE_NAME,
        Item: {
            Id: sessionId
        },
    }).promise();

    return sessionId;
};

export const updateSession = async (sessionId: string, whConfig: WHConfig): Promise<void> => {
    await _updateSessionTableItem(sessionId, { APIUrl: whConfig.apiUrl, BearerToken: whConfig.bearerToken });
};

export const getSession = async (sessionId: string): Promise<WHConfig | null> => {
    const params = {
        TableName: process.env.SESSION_TABLE_NAME,
        Key: {
            Id: sessionId,
        },
    };
    const result = await documentClient.get(params).promise();
    const { APIUrl: apiUrl, BearerToken: bearerToken } = result.Item;
    return { apiUrl, bearerToken };
};

export const getInfo = async (token: string): Promise<BotInfo | null> => {
    try {
        const response = await axios.get(`${process.env.CHANNEL_URL}/api/v1/api-hook/info`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        return response.data.payload.bot;
      } catch (e) {
        console.log('Error in getChannelWebhookInfo from Core: ', e.message);
      }
};

export const isSessionExist = async (sessionId: string): Promise<boolean> => {
    const params = {
        TableName: process.env.SESSION_TABLE_NAME,
        Key: {
            Id: sessionId,
        },
    };
    const { Item } = await documentClient.get(params).promise();
    return !!Item;
};

export const updateSessionMsgCount = async (sessionId: string, increment: number): Promise<boolean> => {
    const params = {
        TableName: process.env.SESSION_TABLE_NAME,
        Key: {
          Id: sessionId,
        },
        UpdateExpression: 'ADD MsgCount :incr',
        ExpressionAttributeValues: {
          ':incr': increment,
        },
        ReturnValues: 'UPDATED_NEW',
    };
    await documentClient.update(params).promise();
    return true;
};

const _updateSessionTableItem = async (sessionId: string, updateMap: { [key: string]: any }) => {
    const updateExpression = "set " + Object.keys(updateMap).map((key) => `#${key} = :${key}`).join(", ");
    const expressionAttributeNames = Object.keys(updateMap).reduce((acc, key) => ({ ...acc, [`#${key}`]: key }), {});
    const expressionAttributeValues = Object.keys(updateMap).reduce((acc, key) => ({ ...acc, [`:${key}`]: updateMap[key] }), {});
  
    const params = {
      TableName: process.env.SESSION_TABLE_NAME,
      Key: { Id: sessionId },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ConditionExpression: "attribute_exists(Id)",
      ReturnValues: "UPDATED_NEW",
    };
  
    try {
      return await documentClient.update(params).promise();
    } catch (error) {
      Logger.error("Error updating item:", error);
      throw error;
    }
  };