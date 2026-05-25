export default function createPost({
  makeInputObj,
  checkDir,
  readFromFile,
  writeToFile,
  makeDataManipulation,
  logger,
}) {
  const dataManipulation = makeDataManipulation();

  return Object.freeze({ post });

  async function post({
    params,
    filename,
    fileDirPath,
    fileDirName,
    filePath,
    errorMsgs,
  }) {
    try {
      logger.info(`[USE-CASE][POST] Inserting user to ${filename} - START!`);

      if (!params || Object.keys(params).length === 0) {
        throw new Error(errorMsgs.NO_DATA);
      }

      const userFactory = makeInputObj({ params });

      const user: Record<string, unknown> = {
        username: userFactory.username(),
        password: userFactory.password(),
        created: dataManipulation.transformDate(userFactory.created()),
        modified: dataManipulation.transformDate(userFactory.modified()),
      };

      if (params.email !== undefined) {
        user.email = userFactory.email();
      }
      if (params.name !== undefined) {
        user.name = userFactory.name();
      }
      if (params.surname !== undefined) {
        user.surname = userFactory.surname();
      }

      await checkDir({ fileDirPath, fileDirName });
      const content = await readFromFile({ filePath, filename });
      const duplicate = content.filter((el) => el.username === user.username);

      if (duplicate.length) {
        throw new Error(errorMsgs.EXISTING_USER);
      }

      content.push(user);
      await writeToFile({ content, filePath, filename });
      logger.info("[POST] [USE-CASE] Inserting Object process - DONE!");
      return user;
    } catch (e) {
      logger.info("[POST] [USE-CASE] Inserting Object process - DONE!");
      throw e;
    }
  }
}
