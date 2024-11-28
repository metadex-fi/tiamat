import { Zygote } from "../data/zygote";

/**
 * The result of comparing current user choices and
 * the total relevant (potentially processed) chain state.
 */
export abstract class Conflux<
  ChoicesT extends Zygote,
  StatusT extends Zygote,
> extends Zygote {
  public readonly state: `incomplete` | `invalid` | `valid`;
  public readonly feedbackMsg: string | null;
  constructor(
    public readonly userChoices: ChoicesT, // user input
    public readonly chainStatus: StatusT, // constraints on user input
  ) {
    super();
    const { state, feedbackMsg } = this.confluence(userChoices, chainStatus);
    this.state = state;
    this.feedbackMsg = feedbackMsg;
  }

  abstract confluence(
    userChoices: ChoicesT,
    chainStatus: StatusT,
  ): {
    state: `incomplete` | `invalid` | `valid`;
    feedbackMsg: string | null;
  };

  public clone = (): Conflux<ChoicesT, StatusT> => {
    return {
      userChoices: this.userChoices.clone() as ChoicesT,
      chainStatus: this.chainStatus.clone() as StatusT,
      state: this.state,
      feedbackMsg: this.feedbackMsg,
    } as Conflux<ChoicesT, StatusT>;
  };

  public equals = (other: Conflux<ChoicesT, StatusT>): boolean => {
    return (
      this.userChoices.equals(other.userChoices) &&
      this.chainStatus.equals(other.chainStatus) &&
      this.state === other.state &&
      this.feedbackMsg === other.feedbackMsg
    );
  };
}
