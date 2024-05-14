// ENTER YOUR API KEY
const OPENAI_API_KEY = "";
const CLAUDE_API_KEY = "";
const GEMINI_API_KEY = "";

$("#models").on("change", show_options);

// Toggle form fields depending on model selected
function show_options(event) {
  const value = event.target.value;
  if (value === "gpt-4o" || value === "gpt-3.5-turbo-0125") {
    $("#dalle_options, #info, #vision_options, #tts_options, #player").hide();
    $("#output").show();
    $("#prompt").attr("required", "");
  } else if (value === "dall-e-3") {
    $("#dalle_options, #info, #output").show();
    $("#vision_options, #tts_options, #player").hide();
    $("#uploaded_image").removeAttr("required");
    $("#prompt").attr("required", "");
  } else if (value === "tts-1") {
    $("#player, #tts_options").show();
    $("#dalle_options, #info, #vision_options, #output").hide();
    $("#uploaded_image").removeAttr("required");
    $("#prompt").attr("required", "");
  } else if (value === "gpt-4-vision-preview") {
    $("#vision_options, #output").show();
    $("#dalle_options, #info, #tts_options, #player").hide();
    $("#prompt").val("What’s in this image?");
    $("#uploaded_image").attr("required", "");
  } else if (value === "claude" || value === "gemini") {
    $("#dalle_options, #info, #vision_options, #tts_options, #player").hide();
    $("#output").show();
    $("#prompt").attr("required", "");
  }
}

// Form Submit Function that prepares api call with model specific data and calls API
function runAI(event) {
  event.preventDefault();
  const prompt = $("#prompt");

  let chosen_model = $("#models").val();
  let data = {};
  let endpoint = "";
  let api = "";

  // GPT4
  if (chosen_model == "gpt-4o" || chosen_model == "gpt-3.5-turbo-0125") {
    endpoint = "chat/completions";
    api = "openai";
    data = {
      model: chosen_model,
      messages: [{ role: "user", content: prompt.val() }],
      temperature: 0.7,
      // max_tokens: 64,
    };
  }

  // TTS
  else if (chosen_model == "tts-1") {
    endpoint = "audio/speech";
    api = "openai";
    data = {
      model: chosen_model,
      input: prompt.val(),
      voice: $("#tts_voice").val(),
    };
  }

  // DALLe-3
  else if (chosen_model == "dall-e-3") {
    endpoint = "images/generations";
    api = "openai";
    data = {
      model: chosen_model,
      prompt: prompt.val(),
      quality: $("#dalle_image_quality").val(),
      style: $("#dalle_style").val(),
      n: 1,
      size: $("#dalle_resolution").val(),
    };
  }

  // VISION
  else if (chosen_model == "gpt-4-vision-preview") {
    endpoint = "chat/completions";
    api = "openai";
    data = {
      model: chosen_model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt.val() },
            {
              type: "image_url",
              image_url: {
                url: uploaded_image,
                detail: $("#vision_detail").val(),
              },
            },
          ],
        },
      ],
      max_tokens: $("#tokens_vision").val() ? parseInt($("#tokens_vision").val(), 10) : 20,
    };
  }

  // CLAUDE
  else if (chosen_model == "claude") {
    api = "claude";
    data = {
      model: "claude-3-sonnet-20240229",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt.val(),
        },
      ],
    };
  }

  // GEMINI
  else if (chosen_model == "gemini") {
    api = "gemini";
    data = {
      contents: [{ parts: [{ text: prompt.val() }] }],
    };
  }

  api_call(data, endpoint, chosen_model, api);
  show_loading();
}

// API Function
async function api_call(data, endpoint, chosen_model, api) {
  if (api === "openai") {
    try {
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify(data),
      };

      const response = await fetch(`https://api.openai.com/v1/${endpoint}`, options);
      // if model is not text-to-speech
      if (chosen_model != "tts-1") {
        const result = await response.json();
        display_result(result, chosen_model);
        console.log(
          "%c API Response at",
          "font-weight:bold",
          new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          result
        );
      } else {
        // text-to-speech endpoint returns audio
        const result = await response.blob();
        display_result(result, chosen_model);
      }
    } catch (error) {
      console.error("An error occurred:", error);
      alert("An error occurred. Please check the console for details.");
      close_loading();
    }
  } else if (api === "claude") {
    const myHeaders = new Headers();
    myHeaders.append("x-api-key", CLAUDE_API_KEY);
    myHeaders.append("anthropic-version", "2023-06-01");
    myHeaders.append("content-type", "application/json");

    try {
      const options = {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify(data),
        redirect: "follow",
      };
      const response = await fetch(`https://api.anthropic.com/v1/messages`, options);
      const result = await response.json();
      display_result(result, chosen_model);
    } catch (error) {
      console.error("An error occurred:", error);
      alert("An error occurred. Please check the console for details.");
      close_loading();
    }
  } else if (api === "gemini") {
    try {
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      };
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
        options
      );
      const result = await response.json();
      display_result(result, chosen_model);
    } catch (error) {
      console.error("An error occurred:", error);
      alert("An error occurred. Please check the console for details.");
      close_loading();
    }
  }
}

// helper function to display the result depending on the model chosen
function display_result(result, chosen_model) {
  close_loading();
  $(".output_area").show();
  // check which model was used
  if (
    chosen_model === "gpt-4o" ||
    chosen_model === "gpt-3.5-turbo-0125" ||
    chosen_model === "gpt-4-vision-preview"
  ) {
    $("#output").html(marked.parse(result.choices[0].message.content));
    // colorize <code> block
    hljs.highlightAll();
    // style <code> block
    add_header_to_code_block();
  } else if (chosen_model === "dall-e-3") {
    // show generated image
    $("#output").html(marked.parse(`![Generated Image](${result.data[0].url})`));
    $("#info").html(
      `<a href="${result.data[0].url}">Full Size Image</a><br><br><b>Revised Prompt:</b><br>${result.data[0].revised_prompt}`
    );
  } else if (chosen_model === "tts-1") {
    var url = URL.createObjectURL(result);
    // show audio player
    $("#player").attr("src", url);
  } else if (chosen_model === "claude") {
    $("#output").html(marked.parse(result));
    hljs.highlightAll();
    add_header_to_code_block();
  } else if (chosen_model === "gemini") {
    $("#output").html(marked.parse(result.candidates[0].content.parts[0].text));
    hljs.highlightAll();
    add_header_to_code_block();
  }
}

// styles the <code> block with a header containing language name and copy button
function add_header_to_code_block() {
  $("code").each(function () {
    // Check if the element has a class and the class starts with "language-"
    if ($(this).attr("class") && $(this).attr("class").startsWith("language-")) {
      const lang = $(this).attr("class").split(" ")[0].split("-")[1];
      let header_div = `<div class="header_div"><div>${lang}</div><div class="copyBtn" onclick="copyCode()">copy</div></div>`;
      $(header_div).prependTo($(this).parent("pre"));
    }
  });
}

// show loading animation
function show_loading() {
  $("#loading_main").show();
  output.classList.add("placeholder");
}

// hide loading animation
function close_loading() {
  $("#loading_main").hide();
  output.classList.remove("placeholder");
}

// preview user selected image in form for GPT4 Vision
function previewImage(event) {
  const reader = new FileReader();
  reader.onload = function () {
    $("#image-preview").attr("src", reader.result);
    $("#image-preview").show();
    uploaded_image = reader.result;
  };
  reader.readAsDataURL(event.target.files[0]);
}

// toggle dark mode
$("#btnSwitch").on("click", () => {
  const currentTheme = document.documentElement.getAttribute("data-bs-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-bs-theme", newTheme);
});

// button in <code> block header to allow user to copy code
function copyCode() {
  var codeBlock = document.querySelector("code");
  navigator.clipboard.writeText(codeBlock.innerText);
}

// users usage data (tokens and cost) for openai api for given api key for the day
async function get_usage() {
  if (OPENAI_API_KEY === "") {
    console.log("ERROR: Cannot get OpenAI usage, API key is not set");
  } else {
    try {
      const formattedDate = new Date().toISOString().slice(0, 10);
      // get usage data for todays date
      const response = await fetch(`https://api.openai.com/v1/usage?date=${formattedDate}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch usage data, make sure API key is set");
      const result = await response.json();
      // debug log
      console.log(
        "%c Usage checked at",
        "font-weight:bold",
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        result
      );
      showUsage(calculateTotalUsage(result));
    } catch (error) {
      console.error("An error occurred:", error);
      alert("An error occurred. Please check the console for details.");
    }
  }
}

// convert api usage to dollar cost
function calculateTotalUsage(data) {
  const prices = {
    "gpt-3.5-turbo-0125": {
      n_context_tokens_total: 0.0005,
      n_generated_tokens_total: 0.0015,
    },
    "gpt-4-1106-vision-preview": {
      n_context_tokens_total: 0.01,
      n_generated_tokens_total: 0.03,
    },
    "gpt-4-0125-preview": {
      n_context_tokens_total: 0.01,
      n_generated_tokens_total: 0.03,
    },
    "dall-e-3": {
      generations: 0.08,
    },
    "tts-1": {
      speech: 0.015,
    },
  };

  // initialize the total usage as zero
  let totalUsage = 0;

  // usage variables for each model
  let gpt3 = {
    n_context_tokens_total: 0,
    n_generated_tokens_total: 0,
  };
  let gpt4 = {
    n_context_tokens_total: 0,
    n_generated_tokens_total: 0,
  };
  let gpt4Vision = {
    n_context_tokens_total: 0,
    n_generated_tokens_total: 0,
  };
  let dalleApiTotals = {
    totalNumImages: 0,
  };
  let ttsTotals = {
    totalCharacters: 0,
  };

  // Loop through the data arrays for each model
  for (let key in data) {
    // Skip the non-array properties
    if (!Array.isArray(data[key])) continue;

    // Loop through the objects in each array
    for (let obj of data[key]) {
      // Get the type of model used from the object
      let modelId = obj.model_id || obj.snapshot_id;

      // get the relevant values from the object
      let inputTokens = obj.n_context_tokens_total || 0;
      let outputTokens = obj.n_generated_tokens_total || 0;
      let images = obj.num_images || 0;
      let characters = obj.num_characters || 0;
      let cost = 0;

      // update the variables for each model
      if (modelId === "gpt-4-0125-preview") {
        gpt4.n_context_tokens_total += inputTokens;
        gpt4.n_generated_tokens_total += outputTokens;
        cost =
          (inputTokens * prices[modelId].n_context_tokens_total +
            outputTokens * prices[modelId].n_generated_tokens_total) /
          1000;
      } else if (modelId === "gpt-4-1106-vision-preview") {
        gpt4Vision.n_context_tokens_total += inputTokens;
        gpt4Vision.n_generated_tokens_total += outputTokens;
        cost =
          (inputTokens * prices[modelId].n_context_tokens_total +
            outputTokens * prices[modelId].n_generated_tokens_total) /
          1000;
      } else if (modelId === "dall-e-3") {
        dalleApiTotals.totalNumImages += images;
        cost = images * prices[modelId].generations;
      } else if (modelId === "tts-1") {
        ttsTotals.totalCharacters += characters;
        cost = (characters * prices[modelId].speech) / 1000;
      } else if (modelId === "gpt-3.5-turbo-0125") {
        gpt3.n_context_tokens_total += inputTokens;
        gpt3.n_generated_tokens_total += outputTokens;
        cost =
          (inputTokens * prices[modelId].n_context_tokens_total +
            outputTokens * prices[modelId].n_generated_tokens_total) /
          1000;
      }
      totalUsage += cost;
    }
  }

  // total cost for the day
  totalUsage = totalUsage.toFixed(2);

  return {
    totalUsage,
    gpt3,
    gpt4,
    gpt4Vision,
    dalleApiTotals,
    ttsTotals,
  };
}

// format the usage data
function showUsage(usage) {
  document.getElementById("usage").innerHTML = `
                          GPT 3: Input: ${usage.gpt3.n_context_tokens_total} / Generated: ${usage.gpt3.n_generated_tokens_total}<br>
                          GPT 4: Input: ${usage.gpt4.n_context_tokens_total} / Generated: ${usage.gpt4.n_generated_tokens_total}<br>
                          GPT 4 Vision: Input: ${usage.gpt4Vision.n_context_tokens_total} / Generated: ${usage.gpt4Vision.n_generated_tokens_total}<br>
                          Dalle 3: Total Images: ${usage.dalleApiTotals.totalNumImages}<br>
                          TTS: Total Characters: ${usage.ttsTotals.totalCharacters}<br>
                          Total Cost: $${usage.totalUsage}
                        `;
}

get_usage();
